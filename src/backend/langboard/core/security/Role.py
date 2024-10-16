from typing import Any, TypeVar
from ...models import GroupAssignedUser
from ...models.BaseRoleModel import ALL_GRANTED, BaseRoleModel
from ..db import DbSession


_TRoleModel = TypeVar("_TRoleModel", bound=BaseRoleModel)


class Role:
    def __init__(self, model_class: type[_TRoleModel], db: DbSession | None = None):
        self._model_class = model_class
        if db:
            self._db = db
        else:
            self._db = DbSession()

    async def is_authorized(self, user_id: int, path_params: dict[str, Any], actions: list[str]) -> bool:
        query = self._db.query("select").column(self._model_class.actions).where(self._model_class.user_id == user_id)

        for column_name in self._model_class.get_filterable_columns(self._model_class):  # type: ignore
            query = query.where(self._model_class[column_name] == path_params[column_name])

        result = await self._db.exec(query)
        granted_actions = result.first()

        # If the user has no direct permissions, check if they have group permissions
        if not granted_actions:
            query = (
                self._db.query("select")
                .column(self._model_class.actions)
                .join(GroupAssignedUser, self._model_class.group_id == GroupAssignedUser.group_id)  # type: ignore
                .where(GroupAssignedUser.user_id == user_id)
            )

            for column_name in self._model_class.get_filterable_columns(self._model_class):  # type: ignore
                query = query.where(self._model_class[column_name] == path_params[column_name])

            result = await self._db.exec(query)
            granted_actions = result.first()

        if not granted_actions:
            return False

        if ALL_GRANTED in granted_actions:
            return True

        for action in actions:
            if action not in granted_actions:
                return False
        return True
