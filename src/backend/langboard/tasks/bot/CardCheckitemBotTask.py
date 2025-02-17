from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, Checkitem, Project
from .utils import BotTaskDataHelper, BotTaskHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "checkitem": Checkitem.api_schema(),
        **(other_schema or {}),
    }


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemCreated, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_created(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemCreated)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemCreated,
        await _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(
    BotTriggerCondition.CardCheckitemTitleChanged, _create_schema(BotTaskDataHelper.changes_schema(("title", "string")))
)
@Broker.wrap_async_task_decorator
async def card_checkitem_title_changed(
    user_or_bot: User | Bot, project: Project, card: Card, old_title: str, checkitem: Checkitem
):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTitleChanged)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTitleChanged,
        await _create_data(
            user_or_bot, project, card, checkitem, BotTaskDataHelper.create_changes({"title": old_title}, checkitem)
        ),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemTimerStarted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_timer_started(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerStarted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerStarted,
        await _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemTimerPaused, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_timer_paused(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerPaused)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerPaused,
        await _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemTimerStopped, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_timer_stopped(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerStopped)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerStopped,
        await _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemChecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_checked(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemChecked)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemChecked,
        await _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemUnchecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemUnchecked)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemUnchecked,
        await _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(
    BotTriggerCondition.CardCheckitemCardified, _create_schema({"cardified_card": Card.api_schema()})
)
@Broker.wrap_async_task_decorator
async def card_checkitem_cardified(
    user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem, new_card: Card
):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemCardified)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemCardified,
        await _create_data(
            user_or_bot,
            project,
            card,
            checkitem,
            {"cardified_card": new_card.api_response()},
        ),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_deleted(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemDeleted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemDeleted,
        await _create_data(user_or_bot, project, card, checkitem),
        project,
    )


async def _create_data(
    user_or_bot: User | Bot,
    project: Project,
    card: Card,
    checkitem: Checkitem,
    other_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        **await BotTaskDataHelper.create_card(user_or_bot, project, card),
        "checkitem": checkitem.api_response(),
        **(other_data or {}),
    }
