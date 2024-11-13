from datetime import datetime
from typing import Any
from sqlmodel import desc
from ...core.schema import Pagination
from ...models import ChatHistory, User
from ..BaseService import BaseService


class ChatHistoryService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "chat_history"

    async def get_list(
        self,
        user: User,
        history_type: str,
        current_date: datetime,
        pagination: Pagination,
        filterable: str | None = None,
    ) -> list[dict[str, Any]]:
        sql_query = (
            self._db.query("select")
            .table(ChatHistory)
            .where((ChatHistory.sender_id == user.id) | (ChatHistory.receiver_id == user.id))
            .where(ChatHistory.history_type == history_type)
            .where(ChatHistory.created_at <= current_date)
        )

        if filterable is not None:
            sql_query = sql_query.where(ChatHistory.filterable == filterable)

        sql_query = self.paginate(sql_query, pagination.page, pagination.limit)
        sql_query = sql_query.order_by(desc(ChatHistory.created_at), desc(ChatHistory.id))
        sql_query = sql_query.group_by(ChatHistory.column("id"), ChatHistory.column("created_at"))

        result = await self._db.exec(sql_query)
        histories = result.all()

        chat_histories = []
        for chat_history in histories:
            chat_histories.append(chat_history.api_response())

        return chat_histories

    async def create(
        self,
        history_type: str,
        message: str,
        filterable: str | None = None,
        sender_id: int | None = None,
        receiver_id: int | None = None,
        commit: bool = True,
    ) -> ChatHistory:
        chat_history = ChatHistory(
            history_type=history_type,
            message=message,
            filterable=filterable,
            sender_id=sender_id,
            receiver_id=receiver_id,
        )

        self._db.insert(chat_history)
        if commit:
            await self._db.commit()
        return chat_history

    async def update(self, chat_history: ChatHistory, commit: bool = True) -> ChatHistory:
        await self._db.update(chat_history)
        if commit:
            await self._db.commit()
        return chat_history

    async def clear(
        self,
        user: User,
        history_type: str,
        filterable: str | None = None,
        commit: bool = True,
    ):
        sql_query = (
            self._db.query("delete")
            .table(ChatHistory)
            .where((ChatHistory.column("sender_id") == user.id) | (ChatHistory.column("receiver_id") == user.id))
            .where(ChatHistory.column("history_type") == history_type)
        )

        if filterable is not None:
            sql_query = sql_query.where(ChatHistory.column("filterable") == filterable)

        await self._db.exec(sql_query)
        if commit:
            await self._db.commit()
