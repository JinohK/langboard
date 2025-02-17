from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, Project
from .utils import BotTaskDataHelper, BotTaskHelper


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCreated)
@Broker.wrap_async_task_decorator
async def card_created(user_or_bot: User | Bot, project: Project, card: Card):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCreated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.CardCreated, BotTaskDataHelper.create_card(user_or_bot, project, card), project
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardUpdated)
@Broker.wrap_async_task_decorator
async def card_updated(user_or_bot: User | Bot, project: Project, card: Card):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardUpdated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.CardUpdated, BotTaskDataHelper.create_card(user_or_bot, project, card), project
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardMoved)
@Broker.wrap_async_task_decorator
async def card_moved(user_or_bot: User | Bot, project: Project, card: Card):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardMoved)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.CardMoved, BotTaskDataHelper.create_card(user_or_bot, project, card), project
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardLabelsUpdated)
@Broker.wrap_async_task_decorator
async def card_labels_updated(user_or_bot: User | Bot, project: Project, card: Card):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardLabelsUpdated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.CardLabelsUpdated, BotTaskDataHelper.create_card(user_or_bot, project, card), project
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardRelationshipsUpdated)
@Broker.wrap_async_task_decorator
async def card_relationship_updated(user_or_bot: User | Bot, project: Project, card: Card):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardRelationshipsUpdated)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardRelationshipsUpdated,
        BotTaskDataHelper.create_card(user_or_bot, project, card),
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardDeleted)
@Broker.wrap_async_task_decorator
async def card_deleted(user_or_bot: User | Bot, project: Project, card: Card):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardDeleted)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.CardDeleted, BotTaskDataHelper.create_card(user_or_bot, project, card), project
    )
