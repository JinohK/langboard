from typing import Any, Callable
from ..ai import BotRunner, InternalBotType
from ..ai.BotDataModel import EditorChatDataMessageModel
from ..db import User
from ..routing import AppRouter, WebSocket
from ..security import Auth


class EdiitorSocketEventCreator:
    def __init__(self, chat_bot_type: InternalBotType, copilot_type: InternalBotType, event_prefix: str) -> None:
        self.chat_bot_type = chat_bot_type
        self.copilot_type = copilot_type
        self.event_prefix = event_prefix

    def register(self, *decorators: Callable):
        def _on(method: Any) -> Callable:
            for decorator in decorators:
                method = decorator(method)
            return method

        AppRouter.socket.on(f"{self.event_prefix}:editor:chat:send")(_on(self.chat))
        AppRouter.socket.on(f"{self.event_prefix}:editor:chat:abort")(_on(self.abort_chat))
        AppRouter.socket.on(f"{self.event_prefix}:editor:copilot:send")(_on(self.copilot))
        AppRouter.socket.on(f"{self.event_prefix}:editor:copilot:abort")(_on(self.abort_copilot))

    async def chat(
        self,
        ws: WebSocket,
        project_uid: str,
        messages: list,
        system: str,
        user: User = Auth.scope("socket"),
    ):
        message_models = []
        for message in messages:
            try:
                message = EditorChatDataMessageModel.model_validate(message)
            except Exception:
                continue

        form = {"messages": message_models, "system": system}
        AppRouter.socket.run_in_thread(self._chat, ws, project_uid, form, user)

    async def abort_chat(self, ws: WebSocket, key: str):
        await BotRunner.abort(InternalBotType.EditorChat, key)
        ws.send(f"{self.event_prefix}:editor:copilot:abort:{key}", {"text": "0"})

    async def copilot(
        self, ws: WebSocket, project_uid: str, prompt: str, system: str, key: str, user: User = Auth.scope("socket")
    ):
        form = {"prompt": prompt, "system": system}
        AppRouter.socket.run_in_thread(self._copilot, ws, project_uid, form, key, user)

    async def abort_copilot(self, ws: WebSocket, key: str):
        await BotRunner.abort(InternalBotType.EditorCopilot, key)
        ws.send(f"{self.event_prefix}:editor:copilot:abort:{key}", {"text": "0"})

    async def _chat(self, ws: WebSocket, project_uid: str, form: dict, key: str, user: User):
        stream_or_str = await BotRunner.run_abortable(
            self.chat_bot_type, {**form, "project_uid": project_uid, "user_uid": user.get_uid()}, key
        )
        ws_stream = ws.stream(f"{self.event_prefix}:editor:chat:stream")
        ws_stream.start()
        message = ""
        if not stream_or_str:
            pass
        elif isinstance(stream_or_str, str):
            ws_stream.buffer(data={"message": stream_or_str})
            message = stream_or_str
        else:
            async for chunk in stream_or_str:
                if not chunk:
                    continue
                ws_stream.buffer(data={"message": chunk})
                message = f"{message}{chunk}"
        ws_stream.end(data={"message": message})

    async def _copilot(self, ws: WebSocket, project_uid: str, form: dict, key: str, user: User):
        stream_or_str = await BotRunner.run_abortable(
            self.copilot_type, {**form, "project_uid": project_uid, "user_uid": user.get_uid()}, key
        )
        if not stream_or_str:
            ws.send(f"{self.event_prefix}:editor:copilot:receive:{key}", {"text": "0"})
            return

        if isinstance(stream_or_str, str):
            ws.send(f"{self.event_prefix}:editor:copilot:receive:{key}", {"text": stream_or_str})
        else:
            chunks = []
            async for chunk in stream_or_str:
                if not chunk:
                    continue
                chunks.append(chunk)
            ws.send(f"{self.event_prefix}:editor:copilot:receive:{key}", {"text": "".join(chunks)})
