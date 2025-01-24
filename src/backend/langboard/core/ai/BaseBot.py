from abc import abstractmethod
from typing import Any, Literal, overload
from httpx import get, post
from pydantic import BaseModel
from requests import Response as HTTPResponse
from requests import Session as HTTPSession
from ..db import DbSession, SqlBuilder
from ..setting import AppSetting, AppSettingType
from ..utils.String import generate_random_string
from .BotResponse import (
    LangflowStreamResponse,
    get_langflow_output_message,
)
from .InternalBotType import InternalBotType


class LangflowRequestModel(BaseModel):
    flow_id: str
    message: str
    tweaks: dict[str, dict[str, Any]] | None = None


class _LangflowAPIRequestModel:
    def __init__(self, settings: dict[AppSettingType, str], request_model: LangflowRequestModel, use_stream: bool):
        self.url = f"{settings[AppSettingType.LangflowUrl]}/api/v1/run/{request_model.flow_id}?stream={use_stream}"
        self.session_id = generate_random_string(32)
        self.headers = {"Content-Type": "application/json", "x-api-key": settings[AppSettingType.LangflowApiKey]}
        req_data: dict[str, Any] = {"input_value": request_model.message, "session": self.session_id}
        if request_model.tweaks:
            req_data["tweaks"] = request_model.tweaks
        self.req_data = req_data
        self.use_stream = use_stream


class BotMetadata(type):
    __bots__: dict[InternalBotType, type["BaseBot"]] = {}

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
    def bot_type() -> InternalBotType: ...

    @staticmethod
    def bot_avatar() -> str | None:
        return None

    def __init__(self):
        if self.__class__ is BaseBot:
            raise TypeError("Can't instantiate abstract class BaseBot")
        self.__abortable_tasks: dict[str, list[HTTPSession | HTTPResponse]] = {}

    @abstractmethod
    async def run(self, data: dict[str, Any]) -> str | LangflowStreamResponse | None: ...

    @abstractmethod
    async def run_abortable(self, data: dict[str, Any], task_id: str) -> str | LangflowStreamResponse | None: ...

    @abstractmethod
    async def is_available(self) -> bool: ...

    async def abort(self, task_id: str):
        if task_id not in self.__abortable_tasks:
            return
        for task in self.__abortable_tasks[task_id]:
            task.close()
        del self.__abortable_tasks[task_id]

    async def _is_langflow_available(self) -> bool:
        settings = await self.__get_langflow_settings()
        if not settings:
            return False

        health_check = get(
            f"{settings[AppSettingType.LangflowUrl]}/health",
            headers={"x-api-key": settings[AppSettingType.LangflowApiKey]},
        )
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
        settings = await self.__get_langflow_settings()
        if not settings:
            return False

        api_request_model = _LangflowAPIRequestModel(settings, request_model, use_stream)

        if use_stream:
            return LangflowStreamResponse(
                api_request_model.url,
                api_request_model.headers,
                api_request_model.req_data,
            )

        try:
            res = post(
                api_request_model.url,
                headers=api_request_model.headers,
                json=api_request_model.req_data,
            )

            if res.status_code != 200:
                return None

            response = res.json()
            return get_langflow_output_message(response)
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
        settings = await self.__get_langflow_settings()
        if not settings:
            return False

        api_request_model = _LangflowAPIRequestModel(settings, request_model, use_stream)
        session = HTTPSession()
        self.__abortable_tasks[task_id] = [session]

        if use_stream:
            return LangflowStreamResponse(
                api_request_model.url,
                api_request_model.headers,
                api_request_model.req_data,
            )

        try:
            res = session.post(
                api_request_model.url,
                headers=api_request_model.headers,
                json=api_request_model.req_data,
                stream=use_stream,
            )
            self.__abortable_tasks[task_id].append(res)

            if not res.connection.poolmanager.pools or res.status_code != 200:
                return None

            response = res.json()
            return get_langflow_output_message(response)
        except Exception:
            return None

    async def __get_langflow_settings(self) -> dict[AppSettingType, str] | None:
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(AppSetting).where(
                    (AppSetting.setting_type == AppSettingType.LangflowUrl)
                    | (AppSetting.setting_type == AppSettingType.LangflowApiKey)
                )
            )
        raw_settings = result.all()
        settings = {row.setting_type: row.get_value() for row in raw_settings}

        if not settings or AppSettingType.LangflowUrl not in settings or AppSettingType.LangflowApiKey not in settings:
            return None

        return settings
