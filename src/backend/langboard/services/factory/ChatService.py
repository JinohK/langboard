from typing import Any, Literal
from core.db import BaseSqlModel, ChatContentModel, DbSession, SqlBuilder
from core.schema import Pagination
from core.service import BaseService
from core.types import SafeDateTime, SnowflakeID
from models import ChatHistory, ChatTemplate, User
from ...core.service import ServiceHelper
from .Types import TChatTemplateParam, TUserParam


class ChatService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "chat"

    async def get_list(
        self,
        user: User,
        filterable_table: str,
        filterable_id: SnowflakeID | str,
        refer_time: SafeDateTime,
        pagination: Pagination,
    ) -> list[dict[str, Any]]:
        filterable_id = ServiceHelper.convert_id(filterable_id)
        sql_query = (
            SqlBuilder.select.table(ChatHistory)
            .where((ChatHistory.sender_id == user.id) | (ChatHistory.receiver_id == user.id))
            .where(
                (ChatHistory.filterable_table == filterable_table)
                & (ChatHistory.filterable_id == filterable_id)
                & (ChatHistory.created_at <= refer_time)
            )
        )

        sql_query = ServiceHelper.paginate(sql_query, pagination.page, pagination.limit)
        sql_query = sql_query.order_by(ChatHistory.column("created_at").desc(), ChatHistory.column("id").desc())
        sql_query = sql_query.group_by(ChatHistory.column("id"), ChatHistory.column("created_at"))

        histories = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            histories = result.all()

        chat_histories = []
        for chat_history in histories:
            chat_histories.append(chat_history.api_response())

        return chat_histories

    async def get_by_uid(self, uid: str) -> ChatHistory | None:
        return ServiceHelper.get_by_param(ChatHistory, uid)

    async def create(
        self,
        filterable_table: str,
        filterable_id: SnowflakeID | str,
        message: ChatContentModel,
        sender: TUserParam | None = None,
        receiver: TUserParam | None = None,
    ) -> ChatHistory:
        filterable_id = ServiceHelper.convert_id(filterable_id)
        sender = ServiceHelper.get_by_param(User, sender) if sender else None
        receiver = ServiceHelper.get_by_param(User, receiver) if receiver else None
        chat_history = ChatHistory(
            filterable_table=filterable_table,
            filterable_id=filterable_id,
            message=message,
            sender_id=sender.id if sender else None,
            receiver_id=receiver.id if receiver else None,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(chat_history)

        return chat_history

    async def update(self, chat_history: ChatHistory) -> ChatHistory:
        with DbSession.use(readonly=False) as db:
            db.update(chat_history)

        return chat_history

    async def delete(self, chat_history: ChatHistory):
        with DbSession.use(readonly=False) as db:
            db.delete(chat_history)

    async def clear(self, user: User, filterable_table: str, filterable_id: int | str):
        filterable_id = ServiceHelper.convert_id(filterable_id)
        sql_query = (
            SqlBuilder.delete.table(ChatHistory)
            .where((ChatHistory.column("sender_id") == user.id) | (ChatHistory.column("receiver_id") == user.id))
            .where(
                (ChatHistory.column("filterable_table") == filterable_table)
                & (ChatHistory.column("filterable_id") == filterable_id)
            )
        )

        with DbSession.use(readonly=False) as db:
            db.exec(sql_query)

    async def get_templates(self, filterable_table: str, filterable_id: int | str) -> list[dict[str, Any]]:
        filterable_id = ServiceHelper.convert_id(filterable_id)
        sql_query = SqlBuilder.select.table(ChatTemplate).where(
            (ChatTemplate.filterable_table == filterable_table) & (ChatTemplate.filterable_id == filterable_id)
        )

        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            templates = result.all()

        return [template.api_response() for template in templates]

    async def create_template(self, filterable: BaseSqlModel, name: str, template: str) -> ChatTemplate:
        chat_template = ChatTemplate(
            filterable_table=filterable.__tablename__,
            filterable_id=filterable.id,
            name=name,
            template=template,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(chat_template)

        return chat_template

    async def update_template(
        self, chat_template: TChatTemplateParam, name: str | None, template: str | None
    ) -> tuple[ChatTemplate, dict[str, Any]] | None | Literal[True]:
        chat_template = ServiceHelper.get_by_param(ChatTemplate, chat_template)
        if not chat_template:
            return None

        model = {}
        if name:
            chat_template.name = name
            model["name"] = name

        if template:
            chat_template.template = template
            model["template"] = template

        if not model:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(chat_template)

        return chat_template, model

    async def delete_template(self, chat_template: TChatTemplateParam) -> bool:
        chat_template = ServiceHelper.get_by_param(ChatTemplate, chat_template)
        if not chat_template:
            return False

        with DbSession.use(readonly=False) as db:
            db.delete(chat_template)
        return True
