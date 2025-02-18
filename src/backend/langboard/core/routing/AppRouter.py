from enum import Enum
from typing import Any, Callable, TypeVar, cast, overload
from fastapi import APIRouter, FastAPI
from pkg_resources import require
from pydantic import BaseModel
from socketify import App as SocketifyApp
from socketify import OpCode
from ...Constants import PROJECT_NAME
from ..security.Auth import get_openapi
from ..utils.decorators import class_instance, thread_safe_singleton
from .AppExceptionHandlingRoute import AppExceptionHandlingRoute
from .SocketManager import SocketManager
from .SocketResponse import SocketResponse
from .SocketTopic import SocketTopic


_TRoute = TypeVar("_TRoute", bound=Callable[..., Any])


@class_instance()
@thread_safe_singleton
class AppRouter:
    """Manages the application's all routers.

    Attributes:
        `api` (`APIRouter`): The API router.
        `socket` (`SocketManager`): The socket router.
    """

    api: APIRouter
    socket: SocketManager

    def __init__(self):
        self.api = APIRouter(route_class=AppExceptionHandlingRoute)
        self.socket = SocketManager()
        self.__socketify_app: SocketifyApp = cast(SocketifyApp, None)

    def set_socketify_app(self, app: SocketifyApp):
        if not self.__socketify_app:
            self.__socketify_app = app

    def schema(
        self,
        *,
        query: type[BaseModel] | None = None,
        form: type[BaseModel] | None = None,
        file_field: str | None = None,
    ):
        def wrapper(func: _TRoute) -> _TRoute:
            setattr(func, "_schema", {"query": query, "form": form, "file_field": file_field})
            return func

        return wrapper

    @overload
    async def publish(
        self, topic: SocketTopic | str, topic_id: str, event_response: str, data: Any = None, compress: bool = False
    ): ...
    @overload
    async def publish(
        self,
        topic: SocketTopic | str,
        topic_id: str,
        event_response: SocketResponse,
        data: None = None,
        compress: bool = False,
    ): ...
    async def publish(
        self,
        topic: SocketTopic | str,
        topic_id: str,
        event_response: SocketResponse | str,
        data: Any = None,
        compress: bool = False,
    ) -> bool:
        if not self.__socketify_app:
            return False

        if isinstance(event_response, str):
            response_model = SocketResponse(event=event_response, data=data)
        elif isinstance(event_response, SocketResponse):
            response_model = event_response
        else:
            return False

        if isinstance(topic, Enum):
            topic = topic.value

        response_model.topic = topic
        response_model.topic_id = topic_id

        socket_topic = f"{topic}:{topic_id}"

        return self.__socketify_app.publish(
            topic=socket_topic, message=response_model.model_dump_json(), opcode=OpCode.TEXT, compress=compress
        )

    def set_openapi_schema(self, app: FastAPI):
        if app.openapi_schema:
            openapi_schema = app.openapi_schema
        else:
            version = require(PROJECT_NAME)[0].version
            openapi_schema = get_openapi(
                title=PROJECT_NAME.capitalize(),
                version=version,
                routes=app.routes,
            )

        if "components" not in openapi_schema:
            openapi_schema["components"] = {}

        if "schemas" not in openapi_schema["components"]:
            openapi_schema["components"]["schemas"] = {}

        openapi_schema["components"]["schemas"]["ValidationError"] = {
            "title": "ValidationError",
            "type": "object",
            "properties": {
                "<error type>": {
                    "title": "Error Type",
                    "type": "object",
                    "properties": {
                        "Literal[body, query, path, header]": {
                            "title": "Location",
                            "type": "array",
                            "items": {"anyOf": [{"type": "string", "example": "<field name>"}]},
                        }
                    },
                }
            },
        }

        app.openapi_schema = openapi_schema
