from enum import Enum
from typing import Any, Callable, Generic, Protocol, Sequence, TypeVar
from sqlmodel.sql.expression import SelectOfScalar
from ...models.BaseRoleModel import BaseRoleModel
from ..utils.decorators import class_instance, thread_safe_singleton
from .BaseFilter import BaseFilter


_TMethod = TypeVar("_TMethod", bound=Callable)
_TRoleModel = TypeVar("_TRoleModel", bound=BaseRoleModel)


class _RoleFinderFunc(Protocol):
    def __call__(
        self,
        query: SelectOfScalar[Sequence[str]],
        path_params: dict[str, Any],
    ) -> SelectOfScalar[Sequence[str]]: ...


@class_instance()
@thread_safe_singleton
class RoleFilter(BaseFilter, Generic[_TMethod]):
    def __init__(self):
        self._filtered: dict[_TMethod, tuple[type, list[str], _RoleFinderFunc | None]] = {}

    def add(
        self, role_model: type[_TRoleModel], actions: list[str | Enum], role_finder: _RoleFinderFunc | None = None
    ) -> Callable[[_TMethod], _TMethod]:
        """Adds a method to be filtered in :class:`RoleMiddleware`.

        This will return a decorator.

        :param method: Method to be filtered
        """

        def _add(method: _TMethod) -> _TMethod:
            str_actions = [action.value if isinstance(action, Enum) else action for action in actions]
            self._filtered[method] = (role_model, str_actions, role_finder)
            return method

        return _add

    def get_filtered(self, method: _TMethod) -> tuple[type[BaseRoleModel], list[str], _RoleFinderFunc | None]:
        """Gets the role model and actions of a method.

        :param method: Method to be filtered
        """
        return self._filtered[method]

    def exists(self, method: _TMethod) -> bool:
        """Checks if a method is in the filter.

        :param method: Method to be checked
        """
        return method in self._filtered
