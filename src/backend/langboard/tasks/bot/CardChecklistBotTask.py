from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, Checklist, Project
from .utils import BotTaskDataHelper, BotTaskHelper


@Broker.wrap_async_task_decorator
async def card_checklist_created(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistCreated)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistCreated,
        create_checklist_data(user_or_bot, project, card, checklist),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checklist_title_changed(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistTitleChanged)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistTitleChanged,
        create_checklist_data(user_or_bot, project, card, checklist),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checklist_checked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistChecked)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistChecked,
        create_checklist_data(user_or_bot, project, card, checklist),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checklist_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistUnchecked)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistUnchecked,
        create_checklist_data(user_or_bot, project, card, checklist),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checklist_deleted(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistDeleted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistDeleted,
        create_checklist_data(user_or_bot, project, card, checklist),
        project,
    )


def create_checklist_data(
    user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_card(user_or_bot, project, card),
        "checklist": checklist.api_response(),
    }
