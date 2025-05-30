from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel


class LangflowConstants(Enum):
    ApiKey = "x-api-key"


class LangflowComponent(ABC, BaseModel):
    @abstractmethod
    def to_tweaks(self) -> dict[str, Any]: ...


class LangboardCalledVariablesComponent(LangflowComponent):
    event: str
    app_api_token: str
    project_uid: str | None = None
    bot_labels_for_project: list[dict[str, Any]] | None = None
    current_runner_type: Literal["bot", "user"]
    current_runner_data: dict[str, Any] | None = None

    def to_tweaks(self) -> dict[str, Any]:
        return {LangboardCalledVariablesComponent.__name__: self.model_dump()}
