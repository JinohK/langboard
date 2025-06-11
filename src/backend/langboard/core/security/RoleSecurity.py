from typing import Any, TypeVar
from ...models.BaseRoleModel import BaseRoleModel
from ..db import DbSession, SqlBuilder
from ..filter.RoleFilter import _RoleFinderFunc


_TRoleModel = TypeVar("_TRoleModel", bound=BaseRoleModel)


class RoleSecurity:
    def __init__(self, model_class: type[_TRoleModel]):
        self._model_class = model_class

    async def is_authorized(
        self,
        user_or_bot_id: int,
        path_params: dict[str, Any],
        actions: list[str],
        role_finder: _RoleFinderFunc | None,
        is_bot: bool = False,
    ) -> bool:
        column_name = "bot_id" if is_bot else "user_id"
        query = SqlBuilder.select.table(self._model_class).where(
            self._model_class.column(column_name) == user_or_bot_id
        )

        if not role_finder:
            for column_name in self._model_class.get_filterable_columns(self._model_class):  # type: ignore
                query = query.where(self._model_class[column_name] == path_params[column_name])
        else:
            query = role_finder(query, path_params, user_or_bot_id, is_bot)

        role = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(query.limit(1))
            role = result.first()

        if not role or not role.actions:
            return False

        if role.is_all_granted():
            return True

        for action in actions:
            if not role.is_granted(action):
                return False
        return True
