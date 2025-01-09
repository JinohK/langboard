from enum import Enum


class InternalBotType(Enum):
    ProjectChat = "project_chat"
    EditorChat = "editor_chat"
    EditorCopilot = "editor_copilot"
