from typing import Callable, TypeVar
from ..utils.decorators import class_instance, thread_safe_singleton
from .BaseFilter import BaseFilter


_TMethod = TypeVar("_TMethod", bound=Callable)


@thread_safe_singleton
@class_instance
class AuthFilter(BaseFilter):
    def add(self, data: _TMethod) -> _TMethod:
        """Adds a method to be filtered in :class:`AuthMiddleware`.

        You can use as a decorator.

        :param method: Method to be filtered
        """
        self._filtered.add(data)
        return data

    def exists(self, data: _TMethod) -> bool:
        return data in self._filtered


AuthFilter = AuthFilter()
