from json import loads as json_loads
from typing import Literal, overload
from httpx import get, post, stream
from ...Constants import LANGFLOW_API_KEY, LANGFLOW_URL
from ...models import Bot
from ...models.Bot import BotType
from ..BaseService import BaseService


class _AiStreamResponse:
    def __init__(self, stream_url: str, params: dict):
        self.__stream_url = stream_url
        self.__params = params

    async def __aiter__(self):
        with stream("GET", self.__stream_url, params=self.__params, timeout=None) as stream_response:
            should_yield = False
            for chunk in stream_response.iter_lines():
                if chunk.count("event: message"):
                    should_yield = True
                    continue

                if not should_yield:
                    continue

                if chunk.startswith("data: "):
                    chunk = chunk[6:]
                should_yield = False
                yield json_loads(chunk)


class BotService(BaseService):
    @staticmethod
    def name() -> str:
        return "bot"

    async def is_available(self, bot: BotType) -> tuple[bool, str | None]:
        if not LANGFLOW_URL or not LANGFLOW_API_KEY:
            return False, None

        health_check = get(f"{LANGFLOW_URL}/health", headers={"x-api-key": LANGFLOW_API_KEY})
        if health_check.status_code != 200:
            return False, None

        sql_query = self._db.query("select").columns(Bot.flow_id, Bot.name).where(Bot.bot_type == bot)
        result = await self._db.exec(sql_query)
        flow_id, bot_name = result.first() or (None, None)

        return isinstance(flow_id, str), bot_name

    @overload
    async def send_chat(self, bot_type: BotType, message: str) -> dict | None: ...
    @overload
    async def send_chat(self, bot_type: BotType, message: str, use_stream: Literal[False]) -> dict | None: ...
    @overload
    async def send_chat(
        self, bot_type: BotType, message: str, use_stream: Literal[True]
    ) -> _AiStreamResponse | None: ...
    async def send_chat(self, bot_type: BotType, message: str, use_stream: bool = False):
        if not LANGFLOW_URL or not LANGFLOW_API_KEY:
            return None

        sql_query = self._db.query("select").columns(Bot.bot_type, Bot.flow_id).where(Bot.bot_type == bot_type)
        result = await self._db.exec(sql_query)
        bot, flow_id = result.first() or (None, None)

        if not bot or not flow_id:
            return None

        try:
            res = post(
                f"{LANGFLOW_URL}/api/v1/run/{flow_id}?stream={use_stream}",
                headers={"Content-Type": "application/json", "x-api-key": LANGFLOW_API_KEY},
                json={"input_value": message},
            )

            if res.status_code != 200:
                return None

            init_response = res.json()

            if not use_stream:
                return init_response

            session_id = init_response["session_id"]
            has_stream_url = "stream_url" in init_response["outputs"][0]["outputs"][0]["artifacts"]
            if not has_stream_url:
                return init_response

            stream_url = init_response["outputs"][0]["outputs"][0]["artifacts"]["stream_url"]

            return _AiStreamResponse(f"{LANGFLOW_URL}{stream_url}", {"session_id": session_id})
        except Exception:
            return None
