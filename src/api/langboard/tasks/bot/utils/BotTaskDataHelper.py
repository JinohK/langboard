from typing import Any, cast
from core.db import DbSession, SqlBuilder
from core.utils.decorators import staticclass
from models import Bot, Card, Project, ProjectColumn, User
from models.bases import BotTriggerCondition
from ....ai import BotDefaultTrigger
from ....core.broker import Broker


@staticclass
class BotTaskDataHelper:
    @staticmethod
    def create_project_column(user_or_bot: User | Bot, project: Project, column: ProjectColumn) -> dict[str, Any]:
        return {
            "project_uid": project.get_uid(),
            "project_column_uid": column.get_uid(),
            "executor": BotTaskDataHelper.create_user_or_bot(user_or_bot),
        }

    @staticmethod
    def create_card(
        user_or_bot: User | Bot, project: Project, card: Card, column: ProjectColumn | None = None
    ) -> dict[str, Any]:
        if not column:
            with DbSession.use(readonly=True) as db:
                result = db.exec(
                    SqlBuilder.select.table(ProjectColumn, with_deleted=True).where(
                        ProjectColumn.column("id") == card.project_column_id
                    )
                )
                column = cast(ProjectColumn, result.first())
        if not column:
            raise ValueError(f"Column with ID {card.project_column_id} not found in project {project.id}")
        return {
            **BotTaskDataHelper.create_project_column(user_or_bot, project, column),
            "card_uid": card.get_uid(),
        }

    @staticmethod
    def create_user_or_bot(user_or_bot: User | Bot) -> dict[str, Any]:
        response = user_or_bot.api_response()
        return response

    @staticmethod
    def schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return Broker.schema("bot", {condition.value: schema or {}})

    @staticmethod
    def project_column_schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return BotTaskDataHelper.schema(
            condition,
            {
                "project_uid": "string",
                "project_column_uid": "string",
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
    def get_updated_assigned_bots(old_bot_ids: list[int], new_bot_ids: list[int]):
        first_time_assigned: list[int] = []
        for bot_id in new_bot_ids:
            if bot_id not in old_bot_ids:
                first_time_assigned.append(bot_id)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(SqlBuilder.select.table(Bot).where(Bot.column("id").in_(first_time_assigned)))
            records = result.all()
        return records

    @staticmethod
    def get_column_by_card(card: Card) -> ProjectColumn | None:
        column = None
        with DbSession.use(readonly=True) as db:
            column = db.exec(
                SqlBuilder.select.table(ProjectColumn, with_deleted=True).where(
                    ProjectColumn.column("id") == card.project_column_id
                )
            )
            column = cast(ProjectColumn, column.first())
        return column
