from typing import Callable, Generic, TypeVar
from ...models.BaseRoleModel import BaseRoleModel
from ..utils.decorators import class_instance, thread_safe_singleton
from .BaseFilter import BaseFilter


_TMethod = TypeVar("_TMethod", bound=Callable)
_TRoleModel = TypeVar("_TRoleModel", bound=BaseRoleModel)


@class_instance()
@thread_safe_singleton
class RoleFilter(BaseFilter, Generic[_TMethod]):
    def __init__(self):
        self._filtered: dict[_TMethod, tuple[type, list[str]]] = {}

    def add(self, role_model: type[_TRoleModel], actions: list[str]) -> Callable[[_TMethod], _TMethod]:
        """Adds a method to be filtered in :class:`RoleMiddleware`.

        This will return a decorator.

        :param method: Method to be filtered
        """

        def _add(method: _TMethod) -> _TMethod:
            self._filtered[method] = (role_model, actions)
            return method

        return _add

    def get_filtered(self, method: _TMethod) -> tuple[type[BaseRoleModel], list[str]]:
        """Gets the role model and actions of a method.

        :param method: Method to be filtered
        """
        return self._filtered[method]

    def exists(self, method: _TMethod) -> bool:
        """Checks if a method is in the filter.

        :param method: Method to be checked
        """
        return method in self._filtered
