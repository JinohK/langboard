from datetime import datetime
from typing import Any
from ...core.db import ChatContentModel, DbSession, SnowflakeID, SqlBuilder, User
from ...core.schema import Pagination
from ...core.service import BaseService
from ...models import ChatHistory
from .Types import TUserParam


class ChatHistoryService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "chat_history"

    async def get_list(
        self,
        user: User,
        history_type: str,
        refer_time: datetime,
        pagination: Pagination,
        filterable: str | None = None,
    ) -> list[dict[str, Any]]:
        sql_query = (
            SqlBuilder.select.table(ChatHistory)
            .where((ChatHistory.sender_id == user.id) | (ChatHistory.receiver_id == user.id))
            .where((ChatHistory.history_type == history_type) & (ChatHistory.created_at <= refer_time))
        )

        if filterable is not None:
            sql_query = sql_query.where(ChatHistory.filterable == SnowflakeID.from_short_code(filterable))

        sql_query = self.paginate(sql_query, pagination.page, pagination.limit)
        sql_query = sql_query.order_by(ChatHistory.column("created_at").desc(), ChatHistory.column("id").desc())
        sql_query = sql_query.group_by(ChatHistory.column("id"), ChatHistory.column("created_at"))

        async with DbSession.use() as db:
            result = await db.exec(sql_query)
        histories = result.all()

        chat_histories = []
        for chat_history in histories:
            chat_histories.append(chat_history.api_response())

        return chat_histories

    async def get_by_uid(self, uid: str) -> ChatHistory | None:
        return await self._get_by_param(ChatHistory, uid)

    async def create(
        self,
        history_type: str,
        message: ChatContentModel,
        filterable: SnowflakeID | str | None = None,
        sender: TUserParam | None = None,
        receiver: TUserParam | None = None,
    ) -> ChatHistory:
        sender = await self._get_by_param(User, sender) if sender else None
        receiver = await self._get_by_param(User, receiver) if receiver else None
        filterable = SnowflakeID.from_short_code(filterable) if isinstance(filterable, str) else filterable
        chat_history = ChatHistory(
            history_type=history_type,
            message=message,
            filterable=filterable,
            sender_id=sender.id if sender else None,
            receiver_id=receiver.id if receiver else None,
        )

        async with DbSession.use() as db:
            db.insert(chat_history)
            await db.commit()
        return chat_history

    async def update(self, chat_history: ChatHistory) -> ChatHistory:
        async with DbSession.use() as db:
            await db.update(chat_history)
            await db.commit()
        return chat_history

    async def delete(self, chat_history: ChatHistory):
        async with DbSession.use() as db:
            await db.delete(chat_history)
            await db.commit()

    async def clear(
        self,
        user: User,
        history_type: str,
        filterable: str | None = None,
    ):
        sql_query = (
            SqlBuilder.delete.table(ChatHistory)
            .where((ChatHistory.column("sender_id") == user.id) | (ChatHistory.column("receiver_id") == user.id))
            .where(ChatHistory.column("history_type") == history_type)
        )

        if filterable is not None:
            sql_query = sql_query.where(ChatHistory.column("filterable") == SnowflakeID.from_short_code(filterable))

        async with DbSession.use() as db:
            await db.exec(sql_query)
            await db.commit()
