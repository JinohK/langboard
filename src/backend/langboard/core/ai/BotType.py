from enum import Enum


class BotType(Enum):
    Project = "project"
    ProjectChat = "project_chat"
    EditorChat = "editor_chat"
    EditorCopilot = "editor_copilot"
