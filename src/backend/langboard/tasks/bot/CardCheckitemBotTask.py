from typing import Any
from ...core.broker import Broker
from ...models import Bot, Card, Checkitem, Project, User
from ...models.BotTrigger import BotTriggerCondition
from .utils import BotTaskDataHelper, BotTaskHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "checkitem_uid": "string",
        **(other_schema or {}),
    }


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemCreated, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_created(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemCreated)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemCreated,
        _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemTitleChanged, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_title_changed(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTitleChanged)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTitleChanged,
        _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemTimerStarted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_timer_started(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerStarted)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerStarted,
        _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemTimerPaused, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_timer_paused(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerPaused)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerPaused,
        _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemTimerStopped, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_timer_stopped(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemTimerStopped)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemTimerStopped,
        _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemChecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_checked(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemChecked)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemChecked,
        _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemUnchecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemUnchecked)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemUnchecked,
        _create_data(user_or_bot, project, card, checkitem),
        project,
    )


@BotTaskDataHelper.card_schema(
    BotTriggerCondition.CardCheckitemCardified, _create_schema({"cardified_card_uid": "string"})
)
@Broker.wrap_async_task_decorator
async def card_checkitem_cardified(
    user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem, new_card: Card
):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemCardified)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemCardified,
        _create_data(
            user_or_bot,
            project,
            card,
            checkitem,
            {"cardified_card_uid": new_card.get_uid()},
        ),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCheckitemDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checkitem_deleted(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCheckitemDeleted)
    BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCheckitemDeleted,
        _create_data(user_or_bot, project, card, checkitem),
        project,
    )


def _create_data(
    user_or_bot: User | Bot,
    project: Project,
    card: Card,
    checkitem: Checkitem,
    other_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_card(user_or_bot, project, card),
        "checkitem_uid": checkitem.get_uid(),
        **(other_data or {}),
    }
