from json import dumps as json_dumps
from pathlib import Path
from typing import Any, Callable, TypeVar
from fastapi import APIRouter, FastAPI
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
from ..Env import Env
from ..utils.decorators import class_instance, thread_safe_singleton
from .ApiErrorCode import ApiErrorCode
from .AppExceptionHandlingRoute import AppExceptionHandlingRoute


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
    __app: FastAPI

    def __init__(self):
        self.api = APIRouter(route_class=AppExceptionHandlingRoute)

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
                title=Env.PROJECT_NAME.capitalize(),
                version=Env.PROJECT_VERSION,
                routes=app.routes,
            )

        if "components" not in openapi_schema:
            openapi_schema["components"] = {}

        if "schemas" not in openapi_schema["components"]:
            openapi_schema["components"]["schemas"] = {}

        for error_code in ApiErrorCode.__members__.values():
            openapi_schema["components"]["schemas"][f"ApiErrorCode{error_code.name}"] = {
                "title": error_code.name,
                "type": "object",
                "properties": {
                    "code": {
                        "title": "Error Code",
                        "type": "string",
                    },
                    "message": {
                        "title": "Error Message",
                        "type": "string",
                    },
                },
                "example": {
                    "code": error_code.name,
                    "message": error_code.value,
                },
            }

        openapi_schema["components"]["schemas"]["EmptyResponse"] = {
            "title": "EmptyResponse",
            "type": "object",
            "properties": {},
        }

        openapi_schema["components"]["schemas"]["ValidationError"] = {
            "title": "ValidationError",
            "type": "object",
            "properties": {
                "code": {
                    "title": "Error Code",
                    "type": "string",
                },
                "message": {
                    "title": "Error Message",
                    "type": "string",
                },
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
                },
            },
        }

        app.openapi_schema = openapi_schema

    def create_schema_file(self, app: FastAPI, schema_dir: str | Path):
        schema_file = Path(schema_dir) / "openapi.json"
        with schema_file.open("w", encoding="utf-8") as f:
            f.write(json_dumps(app.openapi_schema))
        app.openapi_schema = None

    def set_app(self, app: FastAPI):
        self.__app = app

    def get_app(self) -> FastAPI:
        if not self.__app:
            raise ValueError("AppRouter has not been initialized with a FastAPI instance.")
        return self.__app
