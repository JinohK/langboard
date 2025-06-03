from ...core.ai import InternalBotType
from ...core.filter import RoleFilter
from ...core.routing import SocketTopic, WebSocket
from ...core.utils.EdiitorSocketEventCreator import EdiitorSocketEventCreator
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from .scopes import project_role_finder


EDITOR_TYPES = ["card", "wiki"]


async def get_project_uid(ws: WebSocket) -> str | None:
    topics = ws.get_topics()
    for topic in topics:
        if not topic.startswith(SocketTopic.Board.value):
            continue

        return
    return None


def register_board_editor(editor_type: str):
    editor_events = EdiitorSocketEventCreator(
        InternalBotType.EditorChat, InternalBotType.EditorCopilot, f"board:{editor_type}"
    )
    editor_events.register(RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder))


for editor_type in EDITOR_TYPES:
    register_board_editor(editor_type)
