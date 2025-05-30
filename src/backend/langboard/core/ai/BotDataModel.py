from typing import Any, Literal, Never, overload
from pydantic import BaseModel
from .InternalBotType import InternalBotType


class BaseDataModel(BaseModel):
    project_uid: str
    user_uid: str
    file_path: str | None = None


class ProjectChatDataModel(BaseDataModel):
    message: str


class EditorChatDataMessageModel(BaseModel):
    role: str
    content: str


class EditorChatDataModel(BaseDataModel):
    messages: list[EditorChatDataMessageModel]
    system: str


class EditorCopilotDataModel(BaseDataModel):
    prompt: str
    system: str


@overload
def create_bot_data_model(
    bot_type: Literal[InternalBotType.ProjectChat], data: dict[str, Any]
) -> ProjectChatDataModel: ...
@overload
def create_bot_data_model(
    bot_type: Literal[InternalBotType.EditorChat], data: dict[str, Any]
) -> EditorChatDataModel: ...
@overload
def create_bot_data_model(
    bot_type: Literal[InternalBotType.EditorCopilot], data: dict[str, Any]
) -> EditorCopilotDataModel: ...
@overload
def create_bot_data_model(bot_type: InternalBotType, data: dict[str, Any]) -> Never: ...
def create_bot_data_model(bot_type: InternalBotType, data: dict[str, Any]):
    if bot_type == InternalBotType.ProjectChat:
        return ProjectChatDataModel(**data)
    elif bot_type == InternalBotType.EditorChat:
        return EditorChatDataModel(**data)
    elif bot_type == InternalBotType.EditorCopilot:
        return EditorCopilotDataModel(**data)
    raise ValueError(f"Unknown bot type: {bot_type}")
