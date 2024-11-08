from abc import ABC, abstractmethod
from traceback import format_exc
from typing import Generic, Literal, TypeVar
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
from ..utils.String import concat
from .SocketResponseCode import SocketResponseCode


_TException = TypeVar("_TException", bound=Exception)


class EventBaseSocketException(ABC, Exception, Generic[_TException]):
    def __init__(self, route: str, event: str, func: str, exception: _TException) -> None:
        self._route = route
        self._event = event
        self._func = func
        self._formatted_exception = format_exc()
        self.raw_exception = exception

    @abstractmethod
    def __str__(self) -> str: ...


class SocketStatusCodeException(Exception):
    code: SocketResponseCode

    def __init__(self, code: SocketResponseCode, message: str = "") -> None:
        self.code = code
        self.message = message


class SocketEventException(EventBaseSocketException):
    def __str__(self) -> str:
        messages = [
            f"Route: {self._route}",
            f"Event: {self._event}",
            f"Function: {self._func}",
            f"Exception:\n{self._formatted_exception}",
        ]
        return concat("\t", "\n\t".join(messages), "\n")


class SocketRouterScopeException(EventBaseSocketException[_TException], Generic[_TException]):
    raw_exception: _TException

    def __init__(self, route: str, event: str, func: str, param: str, exception: _TException) -> None:
        super().__init__(route, event, func, exception)
        self._event = event
        self._func = func
        self._param = param

    def __str__(self) -> str:
        messages = [
            f"Route: {self._route}",
            f"Event: {self._event}",
            f"Function: {self._func}",
            f"Parameter: {self._param}",
            f"Exception:\n{self._formatted_exception}",
        ]
        return concat("\t", "\n\t".join(messages), "\n")


def MissingException(
    loc: Literal["body", "query", "path", "header"], field: str, inputs: dict | None = None
) -> ValidationError:
    inputs = inputs or {}
    return ValidationError.from_exception_data(
        "Field required", [{"type": "missing", "loc": (loc, field), "input": inputs}]
    )


class InvalidError(BaseModel):
    loc: Literal["body", "query", "path", "header"]
    field: str
    inputs: dict = {}


def InvalidException(*errors: InvalidError) -> RequestValidationError:
    return RequestValidationError(
        errors=[
            {
                "type": "value_error",
                "loc": (error.loc, error.field),
                "input": error.inputs,
                "ctx": {"error": ValueError("Invalid value")},
            }
            for error in errors
        ],
    )
