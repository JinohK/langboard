from typing import Any, Literal, Never, overload
from pydantic import BaseModel
from .BotType import BotType


class ProjectDataModel(BaseModel):
    title: str
    description: str
    project_type: str


class ProjectChatDataModel(BaseModel):
    message: str


class EditorChatDataMessageModel(BaseModel):
    role: str
    content: str


class EditorChatDataModel(BaseModel):
    messages: list[EditorChatDataMessageModel]
    system: str


class EditorCopilotDataModel(BaseModel):
    prompt: str
    system: str


@overload
def create_bot_data_model(bot_type: Literal[BotType.Project], data: dict[str, Any]) -> ProjectDataModel: ...
@overload
def create_bot_data_model(bot_type: Literal[BotType.ProjectChat], data: dict[str, Any]) -> ProjectChatDataModel: ...
@overload
def create_bot_data_model(bot_type: Literal[BotType.EditorChat], data: dict[str, Any]) -> EditorChatDataModel: ...
@overload
def create_bot_data_model(bot_type: Literal[BotType.EditorCopilot], data: dict[str, Any]) -> EditorCopilotDataModel: ...
@overload
def create_bot_data_model(bot_type: BotType, data: dict[str, Any]) -> Never: ...
def create_bot_data_model(bot_type: BotType, data: dict[str, Any]):
    if bot_type == BotType.Project:
        return ProjectDataModel(**data)
    elif bot_type == BotType.ProjectChat:
        return ProjectChatDataModel(**data)
    elif bot_type == BotType.EditorChat:
        return EditorChatDataModel(**data)
    elif bot_type == BotType.EditorCopilot:
        return EditorCopilotDataModel(**data)
    raise ValueError(f"Unknown bot type: {bot_type}")
