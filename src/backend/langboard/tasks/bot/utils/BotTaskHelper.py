from typing import Any
from httpx import post
from ....core.ai import Bot, BotAPIAuthType, BotTrigger, BotTriggerCondition
from ....core.db import DbSession, SqlBuilder
from ....core.logger import Logger
from ....core.utils.decorators import staticclass
from ....models import Project, ProjectAssignedBot, ProjectLabel
from ...WebhookTask import run_webhook
from .BotTaskDataHelper import BotTaskDataHelper


logger = Logger.use("BotTask")


@staticclass
class BotTaskHelper:
    @staticmethod
    async def get_project_assigned_bots(project: Project | int, condition: BotTriggerCondition) -> list[Bot]:
        project_id = project if isinstance(project, int) else project.id
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(Bot)
                .join(ProjectAssignedBot, ProjectAssignedBot.column("bot_id") == Bot.column("id"))
                .join(BotTrigger, BotTrigger.column("bot_id") == Bot.column("id"))
                .where(
                    (ProjectAssignedBot.column("project_id") == project_id)
                    & (BotTrigger.column("condition") == condition)
                )
            )
        return list(result.all())

    @staticmethod
    async def get_project_labels_by_bot(project: Project, bot: Bot) -> list[ProjectLabel]:
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectLabel).where(
                    (ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("bot_id") == bot.id)
                )
            )
        return list(result.all())

    @staticmethod
    async def run(
        bots: Bot | list[Bot], event: BotTriggerCondition | str, data: dict[str, Any], project: Project | None = None
    ):
        if not isinstance(bots, list):
            bots = [bots]

        if not bots:
            return

        event = event if isinstance(event, str) else event.value
        await run_webhook(event, data)

        for bot in bots:
            labels = await BotTaskHelper.get_project_labels_by_bot(project, bot) if project else None
            BotTaskHelper.__run(bot, event, data, labels)

    @staticmethod
    def __run(bot: Bot, event: str, data: dict[str, Any], labels: list[ProjectLabel] | None):
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        response = {
            "event": event,
            "data": data,
            "bot": BotTaskDataHelper.create_user_or_bot(bot),
            "labels_for_project": [label.api_response() for label in labels] if labels else None,
        }
        response["bot"]["app_api_token"] = bot.app_api_token

        if bot.api_auth_type == BotAPIAuthType.Basic:
            headers["Authorization"] = f"Basic {bot.api_key}"
        elif bot.api_auth_type == BotAPIAuthType.Bearer:
            headers["Authorization"] = f"Bearer {bot.api_key}"
        elif bot.api_auth_type == BotAPIAuthType.Langflow:
            headers["x-api-key"] = bot.api_key
        elif bot.api_auth_type == BotAPIAuthType.OpenAI:
            headers["Authorization"] = f"Bearer {bot.api_key}"
        else:
            logger.error("Unknown API Auth Type: %s", bot.api_auth_type)
            return

        try:
            res = post(
                bot.api_url,
                headers=headers,
                json=data,
            )

            if res.status_code != 200:
                logger.error("Failed to request bot: %s(@%s) %s", bot.name, bot.bot_uname, res.text)
        except Exception:
            logger.error("Failed to request bot: %s(@%s)", bot.name, bot.bot_uname)
