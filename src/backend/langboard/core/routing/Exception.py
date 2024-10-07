from abc import ABC, abstractmethod
from traceback import format_exc
from typing import TypeVar
from pydantic import ValidationError
from ..utils.String import concat


_TException = TypeVar("_TException", bound=Exception)


class EventBaseSocketException(ABC, Exception):
    raw_exception: _TException

    def __init__(self, route: str, event: str, func: str, exception: _TException) -> None:
        self._route = route
        self._event = event
        self._func = func
        self._formatted_exception = format_exc()
        self.raw_exception = exception

    @abstractmethod
    def __str__(self) -> str: ...


class SocketEventException(EventBaseSocketException):
    def __str__(self) -> str:
        messages = [
            f"Route: {self._route}",
            f"Event: {self._event}",
            f"Function: {self._func}",
            f"Exception:\n{self._formatted_exception}",
        ]
        return concat("\t", "\n\t".join(messages), "\n")


class SocketRouterScopeException(EventBaseSocketException):
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


def MissingException(loc: str, inputs: dict = {}) -> ValidationError:
    return ValidationError.from_exception_data("Field required", [{"type": "missing", "loc": (loc,), "input": inputs}])
