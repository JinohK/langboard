from typing import Any, cast
from ....core.ai import Bot, BotDefaultTrigger, BotTriggerCondition
from ....core.broker import Broker
from ....core.db import DbSession, SqlBuilder, User
from ....core.utils.decorators import staticclass
from ....models import Card, Project, ProjectColumn, ProjectWiki, ProjectWikiAssignedBot


@staticclass
class BotTaskDataHelper:
    @staticmethod
    def create_project(user_or_bot: User | Bot, project: Project) -> dict[str, Any]:
        return {"project_uid": project.get_uid(), "executor": BotTaskDataHelper.create_user_or_bot(user_or_bot)}

    @staticmethod
    async def create_card(user_or_bot: User | Bot, project: Project, card: Card) -> dict[str, Any]:
        async with DbSession.use() as db:
            column = await db.exec(
                SqlBuilder.select.table(ProjectColumn).where(ProjectColumn.column("id") == card.project_column_id)
            )
        column = cast(ProjectColumn, column.first())
        return {
            **BotTaskDataHelper.create_project(user_or_bot, project),
            "project_column_uid": column.get_uid(),
            "card_uid": card.get_uid(),
        }

    @staticmethod
    def create_user_or_bot(user_or_bot: User | Bot) -> dict[str, Any]:
        response = user_or_bot.api_response()
        if isinstance(user_or_bot, Bot):
            response.pop("as_user")
        return response

    @staticmethod
    async def create_private_wiki(
        runner_bot: Bot,
        user_or_bot: User | Bot,
        project: Project,
        wiki: ProjectWiki,
        other_data: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectWikiAssignedBot).where(
                    (ProjectWikiAssignedBot.column("project_wiki_id") == wiki.id)
                    & (ProjectWikiAssignedBot.column("bot_id") == runner_bot.id)
                )
            )
        is_assigned = bool(result.first())
        if not is_assigned:
            return None
        return {
            **BotTaskDataHelper.create_project(user_or_bot, project),
            "project_wiki_uid": wiki.get_uid(),
            **(other_data or {}),
        }

    @staticmethod
    def schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return Broker.schema("bot", {condition.value: schema or {}})

    @staticmethod
    def project_schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return BotTaskDataHelper.schema(
            condition,
            {
                "project_uid": "string",
                "executor": BotTaskDataHelper.create_user_or_bot_schema(),
                **(schema or {}),
            },
        )

    @staticmethod
    def card_schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return BotTaskDataHelper.schema(
            condition,
            {
                "project_uid": "string",
                "project_column_uid": "string",
                "card_uid": "string",
                "executor": BotTaskDataHelper.create_user_or_bot_schema(),
                **(schema or {}),
            },
        )

    @staticmethod
    def changes_schema(*fields: tuple[str, str | dict]):
        changes = {}
        for field, type_ in fields:
            changes[f"old_{field}"] = type_
            changes[f"new_{field}"] = type_
        return {"changes": changes}

    @staticmethod
    def create_user_or_bot_schema():
        return {"oneOf": {"User": User.api_schema(), "Bot": Bot.api_schema()}}

    @staticmethod
    async def get_updated_assigned_bots(old_bot_ids: list[int], new_bot_ids: list[int]):
        first_time_assigned: list[int] = []
        for bot_id in new_bot_ids:
            if bot_id not in old_bot_ids:
                first_time_assigned.append(bot_id)

        async with DbSession.use() as db:
            result = await db.exec(SqlBuilder.select.table(Bot).where(Bot.column("id").in_(first_time_assigned)))
        return list(result.all())
