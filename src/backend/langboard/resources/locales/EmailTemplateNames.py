from typing import Literal


TEmailTemplateName = Literal[
    "recovery",
    "signup",
    "subemail",
    "project_invitation",
    # Notification
    "mentioned_at_card",
    "mentioned_at_comment",
    "mentioned_at_wiki",
    "assigned_to_card",
    "reacted_to_comment",
    "notified_from_checklist",
]
