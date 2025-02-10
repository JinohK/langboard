from abc import abstractmethod
from enum import Enum
from typing import Any
from sqlmodel import Field
from ..core.ai import Bot
from ..core.db import BaseSqlModel, CSVType, SnowflakeID, SnowflakeIDField, User


ALL_GRANTED = "*"


class BaseRoleModel(BaseSqlModel):
    actions: list[str] = Field(default=[ALL_GRANTED], sa_type=CSVType)
    user_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User.expr("id"), nullable=True)
    bot_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Bot.expr("id"), nullable=True)

    @staticmethod
    @abstractmethod
    def get_all_actions() -> list[Enum]: ...

    @staticmethod
    @abstractmethod
    def get_default_actions() -> list[Enum]: ...

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def is_all_granted(self) -> bool:
        if ALL_GRANTED in self.actions:
            return True
        if self.actions == [action.value for action in self.get_all_actions()]:
            return True
        return False

    def is_granted(self, action: Enum | str):
        if self.is_all_granted():
            return True
        action = action if isinstance(action, str) else action.value
        return action in self.actions

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

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        keys: list[str | tuple[str, str]] = ["user_id"]
        keys.extend(self.get_filterable_columns())
        keys.append("actions")
        return keys
