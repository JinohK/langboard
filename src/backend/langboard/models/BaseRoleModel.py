from abc import abstractmethod
from enum import Enum
from sqlalchemy import JSON
from sqlmodel import Field
from ..core.db import BaseSqlModel
from .Group import Group
from .User import User


ALL_GRANTED = "*"


class BaseRoleModel(BaseSqlModel):
    actions: list[str] = Field(default=[ALL_GRANTED], sa_type=JSON)
    user_id: int | None = Field(default=None, foreign_key=User.expr("id"), nullable=True)
    group_id: int | None = Field(default=None, foreign_key=Group.expr("id"), nullable=True)

    @staticmethod
    @abstractmethod
    def get_default_actions() -> list[Enum]: ...

    def get_filterable_columns(self) -> list[str]:
        if not isinstance(self, BaseRoleModel) and (not isinstance(self, type) or not issubclass(self, BaseRoleModel)):
            return []

        return [field for field in self.model_fields if field not in BaseRoleModel.model_fields]

    def set_default_actions(self) -> None:
        if not isinstance(self, BaseRoleModel):
            return
        self.actions = [action.value for action in self.get_default_actions()]

    def set_all_actions(self) -> None:
        self.actions = [ALL_GRANTED]

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        keys: list[str | tuple[str, str]] = ["user_id", "group_id"]
        keys.extend(self.get_filterable_columns())
        keys.append("actions")
        return keys
