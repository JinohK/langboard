from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, CardAttachment, Project
from .utils import BotTaskDataHelper, BotTaskHelper


@Broker.wrap_async_task_decorator
async def card_attachment_uploaded(user_or_bot: User | Bot, project: Project, card: Card, attachment: CardAttachment):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardAttachmentUploaded)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardAttachmentUploaded,
        create_attachment_data(user_or_bot, project, card, attachment),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_attachment_name_changed(
    user_or_bot: User | Bot, project: Project, card: Card, attachment: CardAttachment
):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardAttachmentNameChanged)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardAttachmentNameChanged,
        create_attachment_data(user_or_bot, project, card, attachment),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_attachment_deleted(user_or_bot: User | Bot, project: Project, card: Card, attachment: CardAttachment):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardAttachmentDeleted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardAttachmentDeleted,
        create_attachment_data(user_or_bot, project, card, attachment),
        project,
    )


def create_attachment_data(
    user_or_bot: User | Bot, project: Project, card: Card, attachment: CardAttachment
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_card(user_or_bot, project, card),
        "attachment": attachment.api_response(),
    }
