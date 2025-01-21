from typing import Any, TypeVar
from ...models.BaseRoleModel import ALL_GRANTED, BaseRoleModel
from ..db import DbSession, SqlBuilder
from ..filter.RoleFilter import _RoleFinderFunc


_TRoleModel = TypeVar("_TRoleModel", bound=BaseRoleModel)


class Role:
    def __init__(self, model_class: type[_TRoleModel]):
        self._model_class = model_class

    async def is_authorized(
        self,
        user_id: int,
        path_params: dict[str, Any],
        actions: list[str],
        role_finder: _RoleFinderFunc | None,
    ) -> bool:
        query = SqlBuilder.select.column(self._model_class.actions).where(self._model_class.user_id == user_id)

        if not role_finder:
            for column_name in self._model_class.get_filterable_columns(self._model_class):  # type: ignore
                query = query.where(self._model_class[column_name] == path_params[column_name])
        else:
            query = role_finder(query, path_params)

        async with DbSession.use_db() as db:
            result = await db.exec(query.limit(1))
        granted_actions = result.first()

        if not granted_actions:
            return False

        if ALL_GRANTED in granted_actions:
            return True

        for action in actions:
            if action not in granted_actions:
                return False
        return True
