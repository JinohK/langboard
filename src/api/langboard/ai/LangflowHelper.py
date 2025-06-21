from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Literal
from core.utils.EditorContentParser import DATA_TEXT_FORMAT_DESCRIPTIONS
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
    bot_labels_for_project: list[dict[str, Any]] = []
    current_runner_type: Literal["bot", "user"]
    current_runner_data: dict[str, Any] | None = None
    rest_data: dict[str, Any] | None = None
    custom_markdown_formats: dict[str, str] = DATA_TEXT_FORMAT_DESCRIPTIONS

    def to_tweaks(self) -> dict[str, Any]:
        return {LangboardCalledVariablesComponent.__name__: self.to_data()}

    def to_data(self) -> dict[str, Any]:
        return self.model_dump()
