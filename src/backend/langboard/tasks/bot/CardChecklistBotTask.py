from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, Checklist, Project
from .utils import BotTaskDataHelper, BotTaskHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "checklist": Checklist.api_schema(),
        **(other_schema or {}),
    }


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistCreated, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_created(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistCreated)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistCreated,
        await _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskDataHelper.card_schema(
    BotTriggerCondition.CardChecklistTitleChanged, _create_schema(BotTaskDataHelper.changes_schema(("title", "string")))
)
@Broker.wrap_async_task_decorator
async def card_checklist_title_changed(
    user_or_bot: User | Bot, project: Project, card: Card, old_title: str, checklist: Checklist
):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistTitleChanged)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistTitleChanged,
        await _create_data(
            user_or_bot, project, card, checklist, BotTaskDataHelper.create_changes({"title": old_title}, checklist)
        ),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistChecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_checked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistChecked)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistChecked,
        await _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistUnchecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistUnchecked)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistUnchecked,
        await _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_deleted(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistDeleted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistDeleted,
        await _create_data(user_or_bot, project, card, checklist),
        project,
    )


async def _create_data(
    user_or_bot: User | Bot,
    project: Project,
    card: Card,
    checklist: Checklist,
    other_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        **await BotTaskDataHelper.create_card(user_or_bot, project, card),
        "checklist": checklist.api_response(),
        **(other_data or {}),
    }
