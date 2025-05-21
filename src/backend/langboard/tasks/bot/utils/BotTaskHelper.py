from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from httpx import post
from ....core.ai import Bot, BotAPIAuthType, BotDefaultTrigger, BotTrigger, BotTriggerCondition
from ....core.db import DbSession, SqlBuilder
from ....core.logger import Logger
from ....core.utils.decorators import staticclass
from ....core.utils.EditorContentParser import DATA_TEXT_FORMAT_DESCRIPTIONS
from ....models import Project, ProjectAssignedBot, ProjectLabel
from ...WebhookTask import run_webhook
from .BotTaskDataHelper import BotTaskDataHelper


logger = Logger.use("BotTask")


@staticclass
class BotTaskHelper:
    @staticmethod
    async def get_project_assigned_bots(project: Project | int, condition: BotTriggerCondition) -> list[Bot]:
        project_id = project if isinstance(project, int) else project.id
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.table(Bot)
                .join(ProjectAssignedBot, ProjectAssignedBot.column("bot_id") == Bot.column("id"))
                .join(BotTrigger, BotTrigger.column("bot_id") == Bot.column("id"))
                .where(
                    (ProjectAssignedBot.column("project_id") == project_id)
                    & (BotTrigger.column("condition") == condition)
                    & (ProjectAssignedBot.column("is_disabled") == False)  # noqa
                )
            )
        return list(result.all())

    @staticmethod
    async def run(
        bots: Bot | list[Bot],
        event: BotTriggerCondition | BotDefaultTrigger,
        data: dict[str, Any],
        project: Project | None = None,
    ):
        if not isinstance(bots, list):
            bots = [bots]

        await run_webhook(event.value, data)

        async with DbSession.use(readonly=True) as db:
            for bot in bots:
                if project:
                    result = await db.exec(
                        SqlBuilder.select.table(ProjectAssignedBot).where(
                            (ProjectAssignedBot.column("bot_id") == bot.id)
                            & (ProjectAssignedBot.column("project_id") == project.id)
                            & (ProjectAssignedBot.column("is_disabled") == False)  # noqa
                        )
                    )
                    if not result.first():
                        continue
                labels = await BotTaskHelper.get_project_labels_by_bot(project, bot, db) if project else None
                BotTaskHelper.__run(bot, event.value, data, labels)

    @staticmethod
    async def get_project_labels_by_bot(project: Project, bot: Bot, db: DbSession) -> list[ProjectLabel]:
        result = await db.exec(
            SqlBuilder.select.table(ProjectLabel).where(
                (ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("bot_id") == bot.id)
            )
        )
        return list(result.all())

    @staticmethod
    def __run(bot: Bot, event: str, data: dict[str, Any], labels: list[ProjectLabel] | None):
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        response = {
            "event": event,
            "data": data,
            "current_running_bot": {
                **BotTaskDataHelper.create_user_or_bot(bot),
                "app_api_token": bot.app_api_token,
                "prompt": bot.prompt,
            },
            "bot_labels_for_project": [label.api_response() for label in labels] if labels else [],
            "custom_markdown_formats": DATA_TEXT_FORMAT_DESCRIPTIONS,
        }

        json_data = {}
        if bot.api_auth_type == BotAPIAuthType.Basic:
            headers["Authorization"] = f"Basic {bot.api_key}"
            json_data = response
        elif bot.api_auth_type == BotAPIAuthType.Bearer:
            headers["Authorization"] = f"Bearer {bot.api_key}"
            json_data = response
        elif bot.api_auth_type == BotAPIAuthType.Langflow:
            headers["x-api-key"] = bot.api_key
            if bot.api_url.count("v1/webhook") > 0:
                json_data = json_loads(json_dumps(response, default=str))
            else:
                json_data = {
                    "input_value": json_dumps(response, default=str),
                    "input_type": "chat",
                    "output_type": "chat",
                    "tweaks": {},
                }
        elif bot.api_auth_type == BotAPIAuthType.OpenAI:
            headers["Authorization"] = f"Bearer {bot.api_key}"
            json_data = response
        else:
            logger.error("Unknown API Auth Type: %s", bot.api_auth_type)
            return

        res = None
        try:
            res = post(
                bot.api_url,
                headers=headers,
                json=json_data,
                timeout=120,
            )

            res.raise_for_status()
        except Exception:
            if res:
                logger.error(
                    "Failed to request bot: %s(@%s) %s: %s", bot.name, bot.bot_uname, str(res.status_code), res.text
                )
            else:
                logger.error("Failed to request bot: %s(@%s)", bot.name, bot.bot_uname)
