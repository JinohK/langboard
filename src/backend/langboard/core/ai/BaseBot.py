from abc import abstractmethod
from typing import Any, Literal, overload
from httpx import Response as HTTPXResponse
from httpx import get, post
from langchain_core.runnables import Runnable
from langchain_core.runnables.utils import Input
from pydantic import BaseModel
from requests import Response as HTTPResponse
from requests import Session as HTTPSession
from ...Constants import LANGFLOW_API_KEY, LANGFLOW_URL
from .BotResponse import (
    LangchainOutput,
    LangchainStreamResponse,
    LangflowStreamResponse,
    get_langchain_output_message,
    get_langflow_output_message,
)
from .BotType import BotType


class LangflowRequestModel(BaseModel):
    flow_id: str
    message: str
    tweaks: dict[str, dict[str, Any]] | None = None


class BotMetadata(type):
    __bots__: dict[BotType, type["BaseBot"]] = {}

    def __new__(cls, name, bases, attrs):
        new_cls: type[BaseBot] = super().__new__(cls, name, bases, attrs)
        bot_type = new_cls.bot_type()  # type: ignore
        if bot_type:
            if bot_type in cls.__bots__:
                raise ValueError(f"Duplicated bot type: {bot_type.name}")
            cls.__bots__[bot_type] = new_cls
        return new_cls


class BaseBot(metaclass=BotMetadata):
    @staticmethod
    @abstractmethod
    def bot_type() -> BotType: ...

    @staticmethod
    @abstractmethod
    def bot_name() -> str: ...

    @staticmethod
    def bot_avatar() -> str | None:
        return None

    def __init__(self):
        if self.__class__ is BaseBot:
            raise TypeError("Can't instantiate abstract class BaseBot")
        self.__abortable_tasks: dict[str, list[HTTPSession | HTTPResponse]] = {}

    @abstractmethod
    async def run(self, data: dict[str, Any]) -> str | LangchainStreamResponse | LangflowStreamResponse | None: ...

    @abstractmethod
    async def run_abortable(
        self, data: dict[str, Any], task_id: str
    ) -> str | LangchainStreamResponse | LangflowStreamResponse | None: ...

    @abstractmethod
    async def is_available(self) -> bool: ...

    async def abort(self, task_id: str):
        if task_id not in self.__abortable_tasks:
            return
        for task in self.__abortable_tasks[task_id]:
            task.close()
        del self.__abortable_tasks[task_id]

    async def _is_langflow_available(self) -> bool:
        if not LANGFLOW_URL or not LANGFLOW_API_KEY:
            return False

        health_check = get(f"{LANGFLOW_URL}/health", headers={"x-api-key": LANGFLOW_API_KEY})
        if health_check.status_code != 200:
            return False

        return True

    @overload
    async def _run_langflow(self, request_model: LangflowRequestModel) -> str | None: ...
    @overload
    async def _run_langflow(self, request_model: LangflowRequestModel, use_stream: Literal[False]) -> str | None: ...
    @overload
    async def _run_langflow(
        self, request_model: LangflowRequestModel, use_stream: Literal[True]
    ) -> LangflowStreamResponse | None: ...
    async def _run_langflow(self, request_model: LangflowRequestModel, use_stream: bool = False):
        if not LANGFLOW_URL or not LANGFLOW_API_KEY:
            return None

        req_data: dict[str, Any] = {"input_value": request_model.message}
        if request_model.tweaks:
            req_data["tweaks"] = request_model.tweaks

        try:
            res = post(
                f"{LANGFLOW_URL}/api/v1/run/{request_model.flow_id}?stream={use_stream}",
                headers={"Content-Type": "application/json", "x-api-key": LANGFLOW_API_KEY},
                json=req_data,
            )

            return self.__create_langflow_response(res, use_stream)
        except Exception:
            return None

    @overload
    async def _run_langflow_abortable(self, task_id: str, request_model: LangflowRequestModel) -> str | None: ...
    @overload
    async def _run_langflow_abortable(
        self, task_id: str, request_model: LangflowRequestModel, use_stream: Literal[False]
    ) -> str | None: ...
    @overload
    async def _run_langflow_abortable(
        self, task_id: str, request_model: LangflowRequestModel, use_stream: Literal[True]
    ) -> LangflowStreamResponse | None: ...
    async def _run_langflow_abortable(
        self, task_id: str, request_model: LangflowRequestModel, use_stream: bool = False
    ):
        if not LANGFLOW_URL or not LANGFLOW_API_KEY:
            return None

        session = HTTPSession()
        self.__abortable_tasks[task_id] = [session]

        try:
            res = session.post(
                f"{LANGFLOW_URL}/api/v1/run/{request_model.flow_id}?stream={use_stream}",
                json={"input_value": request_model.message, "tweaks": request_model.tweaks},
                headers={"Content-Type": "application/json", "x-api-key": LANGFLOW_API_KEY},
                stream=use_stream,
            )
            self.__abortable_tasks[task_id].append(res)

            if not res.connection.poolmanager.pools:
                return None

            return self.__create_langflow_response(res, use_stream)
        except Exception:
            return None

    @overload
    async def _run_langchain(self, runnable: Runnable[Input, LangchainOutput], input: Input) -> str | None: ...
    @overload
    async def _run_langchain(
        self, runnable: Runnable[Input, LangchainOutput], input: Input, use_stream: Literal[False]
    ) -> str | None: ...
    @overload
    async def _run_langchain(
        self, runnable: Runnable[Input, LangchainOutput], input: Input, use_stream: Literal[True]
    ) -> LangchainStreamResponse: ...
    async def _run_langchain(self, runnable: Runnable[Input, LangchainOutput], input: Input, use_stream: bool = False):  # type: ignore
        if not use_stream:
            output = await runnable.ainvoke(input)
            return get_langchain_output_message(output)  # type: ignore
        return LangchainStreamResponse(runnable, input)

    def __create_langflow_response(
        self, res: HTTPXResponse | HTTPResponse, use_stream: bool
    ) -> str | LangflowStreamResponse | None:
        if res.status_code != 200:
            return None

        init_response = res.json()

        if not use_stream:
            return get_langflow_output_message(init_response)

        session_id = init_response["session_id"]
        has_stream_url = "stream_url" in init_response["outputs"][0]["outputs"][0]["artifacts"]
        if not has_stream_url:
            return init_response

        stream_url = init_response["outputs"][0]["outputs"][0]["artifacts"]["stream_url"]

        return LangflowStreamResponse(f"{LANGFLOW_URL}{stream_url}", {"session_id": session_id})
