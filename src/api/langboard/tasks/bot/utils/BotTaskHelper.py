from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from core.db import DbSession, SqlBuilder
from core.utils.Converter import json_default
from core.utils.decorators import staticclass
from httpx import post
from models import Bot, BotTrigger, Project, ProjectAssignedBot, ProjectLabel
from models.Bot import BotAPIAuthType
from models.BotTrigger import BotTriggerCondition
from ....ai import BotDefaultTrigger, LangboardCalledVariablesComponent, LangflowConstants
from ....core.logger import Logger
from ...WebhookTask import run_webhook
from .BotTaskDataHelper import BotTaskDataHelper


logger = Logger.use("BotTask")


@staticclass
class BotTaskHelper:
    @staticmethod
    def get_project_assigned_bots(project: Project | int, condition: BotTriggerCondition) -> list[Bot]:
        project_id = project if isinstance(project, int) else project.id
        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(Bot)
                .join(ProjectAssignedBot, ProjectAssignedBot.column("bot_id") == Bot.column("id"))
                .join(BotTrigger, BotTrigger.column("bot_id") == Bot.column("id"))
                .where(
                    (ProjectAssignedBot.column("project_id") == project_id)
                    & (BotTrigger.column("condition") == condition)
                    & (ProjectAssignedBot.column("is_disabled") == False)  # noqa
                )
            )
            records = result.all()
        return records

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

        for bot in bots:
            if project:
                record = None
                with DbSession.use(readonly=True) as db:
                    result = db.exec(
                        SqlBuilder.select.table(ProjectAssignedBot).where(
                            (ProjectAssignedBot.column("bot_id") == bot.id)
                            & (ProjectAssignedBot.column("project_id") == project.id)
                            & (ProjectAssignedBot.column("is_disabled") == False)  # noqa
                        )
                    )
                    record = result.first()
                if not record:
                    continue
            labels = BotTaskHelper.get_project_labels_by_bot(project, bot) if project else []
            BotTaskHelper.__run(bot, event.value, data, project, labels)

    @staticmethod
    def get_project_labels_by_bot(project: Project, bot: Bot) -> list[ProjectLabel]:
        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectLabel).where(
                    (ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("bot_id") == bot.id)
                )
            )
            records = result.all()
        return records

    @staticmethod
    def __run(bot: Bot, event: str, data: dict[str, Any], project: Project | None, labels: list[ProjectLabel] | None):
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        json_data = {}
        if bot.api_auth_type == BotAPIAuthType.Langflow:
            headers[LangflowConstants.ApiKey.value] = bot.api_key
            tweaks = LangboardCalledVariablesComponent(
                event=event,
                app_api_token=bot.app_api_token,
                project_uid=project.get_uid() if project else None,
                bot_labels_for_project=[label.api_response() for label in labels] if labels else [],
                current_runner_type="bot",
                current_runner_data={
                    **BotTaskDataHelper.create_user_or_bot(bot),
                    "prompt": bot.prompt,
                },
                rest_data=json_loads(json_dumps(data, default=json_default)),
            ).to_data()

            if bot.api_url.count("v1/webhook") > 0:
                json_data = {
                    "tweaks": tweaks,
                }
            else:
                json_data = {
                    "input_value": "",
                    "input_type": "chat",
                    "output_type": "chat",
                    "tweaks": tweaks,
                }
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
