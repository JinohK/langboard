from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, Checkitem, Project
from .utils import BotTaskDataHelper, BotTaskHelper


@Broker.wrap_async_task_decorator
async def card_checkitem_created(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemCreated)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemCreated,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checkitem_title_changed(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTitleChanged)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTitleChanged,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checkitem_timer_started(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerStarted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerStarted,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checkitem_timer_paused(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerPaused)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerPaused,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checkitem_timer_stopped(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerStopped)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerStopped,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checkitem_checked(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemChecked)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemChecked,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checkitem_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemUnchecked)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemUnchecked,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checkitem_cardified(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemDeleted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemDeleted,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


@Broker.wrap_async_task_decorator
async def card_checkitem_deleted(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemDeleted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemDeleted,
        create_checkitem_data(user_or_bot, project, card, checkitem),
        project,
    )


def create_checkitem_data(
    user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_card(user_or_bot, project, card),
        "checkitem": checkitem.api_response(),
    }
