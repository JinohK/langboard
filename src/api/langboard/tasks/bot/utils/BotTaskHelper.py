from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, overload
from core.db import BaseSqlModel, DbSession, SqlBuilder
from core.utils.Converter import json_default
from core.utils.decorators import staticclass
from httpx import TimeoutException, post
from langboard.publishers import ProjectBotPublisher
from models import Bot, BotLog, Project
from models.bases import BaseBotLogModel, BotTriggerCondition
from models.Bot import BotAPIAuthType
from models.BotLog import BotLogMessage, BotLogType
from ....ai import BotDefaultTrigger, LangboardCalledVariablesComponent, LangflowConstants
from ....core.logger import Logger
from ....core.utils.BotUtils import BotUtils
from ...WebhookTask import run_webhook
from .BotTaskDataHelper import BotTaskDataHelper


logger = Logger.use("BotTask")


@staticclass
class BotTaskHelper:
    @staticmethod
    def get_scoped_bots(condition: BotTriggerCondition, **where_clauses: Any) -> list[tuple[Bot, BaseSqlModel]]:
        model_classes = BotUtils.get_scope_model_classes_by_condition(condition)
        records: list[tuple[Bot, BaseSqlModel]] = []
        with DbSession.use(readonly=True) as db:
            for model_class in model_classes:
                column_name = model_class.get_scope_column_name()
                if column_name not in where_clauses or not where_clauses[column_name]:
                    continue

                target_table = BotUtils.get_target_table_by_bot_model("scope", model_class)
                if not target_table:
                    continue

                target_table_class = BotUtils.AVAILABLE_TARGET_TABLES[target_table]

                result = db.exec(
                    SqlBuilder.select.tables(Bot, model_class, target_table_class)
                    .join(model_class, model_class.column("bot_id") == Bot.column("id"))
                    .join(target_table_class, target_table_class.column("id") == model_class.column(column_name))
                    .where(
                        (model_class.column("conditions").contains([condition.value]))
                        & (model_class.column(column_name) == where_clauses[column_name])
                    )
                )
                records.extend([(bot, scope_model) for bot, _, scope_model in result.all()])
        return records

    @overload
    @staticmethod
    async def run(
        bots: Bot | list[Bot],
        event: BotTriggerCondition | BotDefaultTrigger,
        data: dict[str, Any],
        project: Project | None = None,
        scope_model: BaseSqlModel | None = None,
    ): ...
    @overload
    @staticmethod
    async def run(
        bots: list[tuple[Bot, BaseSqlModel]],
        event: BotTriggerCondition | BotDefaultTrigger,
        data: dict[str, Any],
        project: Project | None = None,
    ): ...
    @staticmethod
    async def run(
        bots: Bot | list[Bot] | list[tuple[Bot, BaseSqlModel]],
        event: BotTriggerCondition | BotDefaultTrigger,
        data: dict[str, Any],
        project: Project | None = None,
        scope_model: BaseSqlModel | None = None,
    ):
        if not isinstance(bots, list):
            bots = [bots]

        await run_webhook(event.value, data)

        for bot in bots:
            if isinstance(bot, tuple):
                bot, scope_model = bot
            await BotTaskHelper.__run(bot, event.value, data, project, scope_model)

    @staticmethod
    async def __run(
        bot: Bot, event: str, data: dict[str, Any], project: Project | None, scope_model: BaseSqlModel | None
    ):
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        bot_log = await BotTaskHelper.__create_log(
            bot, BotLogType.Info, f"'{event}' task started", scope_model, project
        )

        json_data = {}
        if bot.api_auth_type == BotAPIAuthType.Langflow:
            headers[LangflowConstants.ApiKey.value] = bot.api_key
            tweaks = LangboardCalledVariablesComponent(
                event=event,
                app_api_token=bot.app_api_token,
                project_uid=project.get_uid() if project else None,
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
            await BotTaskHelper.__update_log(
                bot_log, BotLogType.Error, f"Unknown API Auth Type: {bot.api_auth_type}", project
            )
            return

        await BotTaskHelper.__try_request(bot, headers, json_data, bot_log, project, 0)

    @staticmethod
    async def __create_log(
        bot: Bot, log_type: BotLogType, message: str, scope_model: BaseSqlModel | None, project: Project | None
    ):
        bot_log = BotLog(
            bot_id=bot.id, log_type=log_type, message_stack=[BotLogMessage(message=message, log_type=log_type)]
        )

        with DbSession.use(readonly=False) as db:
            db.insert(bot_log)

        if not scope_model:
            return bot_log, None

        log_class = BotUtils.get_bot_model_class("log", scope_model.__tablename__)
        if not log_class:
            return bot_log, None

        params: dict[str, Any] = {
            f"{scope_model.__tablename__}_id": scope_model.id,
            "bot_log_id": bot_log.id,
        }

        scope_log = log_class(**params)
        with DbSession.use(readonly=False) as db:
            db.insert(scope_log)

        if project:
            await ProjectBotPublisher.log_created(project, (bot_log, scope_log))
        return bot_log, scope_log

    @staticmethod
    async def __try_request(
        bot: Bot,
        headers: dict[str, Any],
        json_data: dict[str, Any],
        bot_log: tuple[BotLog, BaseBotLogModel | None],
        project: Project | None,
        retried: int = 0,
    ) -> None:
        res = None
        try:
            res = post(
                url=bot.api_url,
                headers=headers,
                json=json_data,
                timeout=120,
            )
            res.raise_for_status()
            text = res.text
            logger.info("Successfully requested bot: %s(@%s)", bot.name, bot.bot_uname)
            await BotTaskHelper.__update_log(
                bot_log, BotLogType.Success, text if text else "Successfully executed", project
            )
        except TimeoutException as e:
            if retried < 5:
                return await BotTaskHelper.__try_request(bot, headers, json_data, bot_log, project, retried + 1)
            logger.error("Timeout while requesting bot: %s", e)
            await BotTaskHelper.__update_log(bot_log, BotLogType.Error, str(e), project)
        except Exception as e:
            if res:
                logger.error(
                    "Failed to request bot: %s(@%s) %s: %s", bot.name, bot.bot_uname, str(res.status_code), res.text
                )
                await BotTaskHelper.__update_log(bot_log, BotLogType.Error, f"{res.status_code}: {res.text}", project)
            else:
                logger.error("Failed to request bot: %s(@%s)", bot.name, bot.bot_uname)
                await BotTaskHelper.__update_log(bot_log, BotLogType.Error, str(e), project)

    @staticmethod
    async def __update_log(
        bot_log: tuple[BotLog, BaseBotLogModel | None], log_type: BotLogType, stack: str, project: Project | None
    ) -> None:
        log, scope_log = bot_log
        log.log_type = log_type
        log_stack = BotLogMessage(message=stack, log_type=log_type)
        message_stack = log.message_stack
        message_stack.append(log_stack)
        log.message_stack = message_stack

        with DbSession.use(readonly=False) as db:
            db.update(log)

        if project and scope_log:
            await ProjectBotPublisher.log_stack_added(project, log, log_stack)
