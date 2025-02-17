from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, CardAttachment, Project
from .utils import BotTaskDataHelper, BotTaskHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "attachment": CardAttachment.api_schema(),
        **(other_schema or {}),
    }


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardAttachmentUploaded, _create_schema())
@Broker.wrap_async_task_decorator
async def card_attachment_uploaded(user_or_bot: User | Bot, project: Project, card: Card, attachment: CardAttachment):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardAttachmentUploaded)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardAttachmentUploaded,
        await _create_data(user_or_bot, project, card, attachment),
        project,
    )


@BotTaskDataHelper.card_schema(
    BotTriggerCondition.CardAttachmentNameChanged, _create_schema(BotTaskDataHelper.changes_schema(("name", "string")))
)
@Broker.wrap_async_task_decorator
async def card_attachment_name_changed(
    user_or_bot: User | Bot, project: Project, card: Card, old_name: str, attachment: CardAttachment
):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardAttachmentNameChanged)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardAttachmentNameChanged,
        await _create_data(
            user_or_bot, project, card, attachment, BotTaskDataHelper.create_changes({"name": old_name}, attachment)
        ),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardAttachmentDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_attachment_deleted(user_or_bot: User | Bot, project: Project, card: Card, attachment: CardAttachment):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardAttachmentDeleted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardAttachmentDeleted,
        await _create_data(user_or_bot, project, card, attachment),
        project,
    )


async def _create_data(
    user_or_bot: User | Bot,
    project: Project,
    card: Card,
    attachment: CardAttachment,
    other_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        **await BotTaskDataHelper.create_card(user_or_bot, project, card),
        "attachment": attachment.api_response(),
        **(other_data or {}),
    }
