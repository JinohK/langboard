from datetime import datetime
from typing import Any
from sqlmodel import desc
from ...core.schema import Pagination
from ...models import ChatHistory, User
from ..BaseService import BaseService


class ChatHistoryService(BaseService):
    @staticmethod
    def name() -> str:
        return "chat_history"

    async def get_list(
        self,
        user: User,
        history_type: str,
        current_date: datetime,
        pagination: Pagination,
        filterable: str | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        sql_query = (
            self._db.query("select")
            .columns(ChatHistory.uid, ChatHistory.sender_id, ChatHistory.receiver_id, ChatHistory.message)
            .where((ChatHistory.sender_id == user.id) | (ChatHistory.receiver_id == user.id))
            .where(ChatHistory.history_type == history_type)
            .where(ChatHistory.created_at <= current_date)
        )

        if filterable is not None:
            sql_query = sql_query.where(ChatHistory.filterable == filterable)

        sql_query = sql_query.order_by(desc(ChatHistory.created_at), desc(ChatHistory.id))
        result = await self._db.exec(self._db.query("select").count(sql_query, ChatHistory.id))
        (total,) = result.one()

        sql_query = self.paginate(sql_query, pagination.page, pagination.limit)

        result = await self._db.exec(sql_query)
        histories = result.all()

        chat_histories = []
        for uid, sender_id, receiver_id, message in histories:
            chat_histories.append(
                {
                    "uid": uid,
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "message": message,
                }
            )

        return chat_histories, total

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
            .where((ChatHistory.sender_id == user.id) | (ChatHistory.receiver_id == user.id))  # type: ignore
            .where(ChatHistory.history_type == history_type)  # type: ignore
        )

        if filterable is not None:
            sql_query = sql_query.where(ChatHistory.filterable == filterable)  # type: ignore

        await self._db.exec(sql_query)
        if commit:
            await self._db.commit()
