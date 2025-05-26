from typing import Any, Callable, TypeVar
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel
from ...Constants import PROJECT_NAME, PROJECT_VERSION
from ..security.Auth import get_openapi
from ..utils.decorators import class_instance, thread_safe_singleton
from .AppExceptionHandlingRoute import AppExceptionHandlingRoute
from .SocketManager import SocketManager


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
    __app: FastAPI

    def __init__(self):
        self.api = APIRouter(route_class=AppExceptionHandlingRoute)
        self.socket = SocketManager()

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

    def set_openapi_schema(self, app: FastAPI):
        if app.openapi_schema:
            openapi_schema = app.openapi_schema
        else:
            openapi_schema = get_openapi(
                title=PROJECT_NAME.capitalize(),
                version=PROJECT_VERSION,
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

    def set_app(self, app: FastAPI):
        self.__app = app

    def get_app(self) -> FastAPI:
        if not self.__app:
            raise ValueError("AppRouter has not been initialized with a FastAPI instance.")
        return self.__app
