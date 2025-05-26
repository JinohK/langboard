from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, Checklist, Project
from .utils import BotTaskDataHelper, BotTaskHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "checklist_uid": "string",
        **(other_schema or {}),
    }


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistCreated, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_created(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistCreated)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistCreated,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistTitleChanged, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_title_changed(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistTitleChanged)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistTitleChanged,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistChecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_checked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistChecked)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistChecked,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistUnchecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistUnchecked)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistUnchecked,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardChecklistDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_deleted(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardChecklistDeleted)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistDeleted,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


def _create_data(
    user_or_bot: User | Bot,
    project: Project,
    card: Card,
    checklist: Checklist,
    other_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_card(user_or_bot, project, card),
        "checklist_uid": checklist.get_uid(),
        **(other_data or {}),
    }
