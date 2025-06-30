from typing import Any, TypeVar, cast
from core.db import DbSession, SqlBuilder
from models.BaseRoleModel import BaseRoleModel
from sqlmodel.sql.expression import SelectOfScalar
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
        role_finder: _RoleFinderFunc[_TRoleModel],
        is_bot: bool = False,
    ) -> bool:
        column_name = "bot_id" if is_bot else "user_id"
        query = SqlBuilder.select.table(self._model_class).where(
            self._model_class.column(column_name) == user_or_bot_id
        )

        query = role_finder(cast(SelectOfScalar[_TRoleModel], query), path_params, user_or_bot_id, is_bot)

        role = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(query.limit(1))
            role = result.first()

        if not role or not role.actions:
            return False
        return role.is_granted(actions)
