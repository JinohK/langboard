from datetime import datetime
from typing import Any
from pydantic import BaseModel
from ..core.ai import Bot
from ..core.db import BaseSqlModel, EditorContentModel, User
from ..core.utils.decorators import staticclass
from ..models import (
    Card,
    CardAttachment,
    CardComment,
    Checkitem,
    Checklist,
    GlobalCardRelationshipType,
    Project,
    ProjectColumn,
    ProjectLabel,
    ProjectWiki,
)


@staticclass
class ActivityHistoryHelper:
    @staticmethod
    def create_user_or_bot_history(user_or_bot: User | Bot):
        avatar_path = None
        if isinstance(user_or_bot.avatar, dict):
            avatar_path = user_or_bot.avatar.get("path")
        elif user_or_bot.avatar:
            avatar_path = user_or_bot.avatar.path
        if isinstance(user_or_bot, User):
            if user_or_bot.deleted_at:
                return {
                    "type": User.UNKNOWN_USER_TYPE,
                    "firstname": "",
                    "lastname": "",
                    "avatar": None,
                }
            return {
                "type": User.USER_TYPE,
                "firstname": user_or_bot.firstname,
                "lastname": user_or_bot.lastname,
                "avatar": avatar_path,
            }
        else:
            return {
                "type": User.BOT_TYPE,
                "name": user_or_bot.name,
                "avatar": avatar_path,
            }

    @staticmethod
    def create_project_history(project: Project):
        return {
            "title": project.title,
            "project_type": project.project_type,
        }

    @staticmethod
    def create_project_column_history(column: Project | ProjectColumn):
        return {
            "name": column.name if isinstance(column, ProjectColumn) else column.archive_column_name,
        }

    @staticmethod
    def create_label_history(label: ProjectLabel):
        return {
            "name": label.name,
            "color": label.color,
        }

    @staticmethod
    def create_project_wiki_history(wiki: ProjectWiki):
        return {
            "title": wiki.title,
        }

    @staticmethod
    def create_card_history(card: Card, column: Project | ProjectColumn):
        history = {
            "card": {
                "title": card.title,
            }
        }
        history["column"] = ActivityHistoryHelper.create_project_column_history(column)
        return history

    @staticmethod
    def create_card_attachment_history(attachment: CardAttachment):
        return {
            "name": attachment.filename,
            "url": attachment.file.path,
        }

    @staticmethod
    def create_checklist_or_checkitem_history(check: Checklist | Checkitem):
        return {
            "title": check.title,
        }

    @staticmethod
    def create_card_comment_history(comment: CardComment, user_or_bot: User | Bot):
        return {
            "content": ActivityHistoryHelper.convert_to_python(comment.content),
            "author": ActivityHistoryHelper.create_user_or_bot_history(user_or_bot),
        }

    @staticmethod
    def create_card_relationship(global_relationship: GlobalCardRelationshipType, related_card: Card, is_parent: bool):
        return {
            "relationship_name": global_relationship.parent_name if is_parent else global_relationship.child_name,
            "related_card_title": related_card.title,
        }

    @staticmethod
    def create_changes(before: dict[str, Any], model: BaseSqlModel):
        after = {key: getattr(model, key) for key in before}
        for key in before:
            before[key] = ActivityHistoryHelper.convert_to_python(before[key])
            after[key] = ActivityHistoryHelper.convert_to_python(after[key])

        return {"changed": {"before": before, "after": after}}

    @staticmethod
    def convert_to_python(data: Any) -> Any:
        if isinstance(data, EditorContentModel):
            return {
                "type": "editor",
                **data.model_dump(),
            }
        elif isinstance(data, BaseModel):
            return data.model_dump()
        elif isinstance(data, datetime):
            return data.isoformat()
        return data
