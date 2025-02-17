from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, CardComment, Project
from .utils import BotTaskDataHelper, BotTaskHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "comment": CardComment.api_schema(),
        **(other_schema or {}),
    }


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCommentAdded, _create_schema())
@Broker.wrap_async_task_decorator
async def card_comment_added(user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCommentAdded)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.CardCommentAdded, create_comment_data(user_or_bot, project, card, comment), project
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCommentUpdated, _create_schema())
@Broker.wrap_async_task_decorator
async def card_comment_updated(user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCommentUpdated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.CardCommentUpdated, create_comment_data(user_or_bot, project, card, comment), project
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCommentDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_comment_deleted(user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCommentDeleted)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.CardCommentDeleted, create_comment_data(user_or_bot, project, card, comment), project
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCommentReacted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_comment_reacted(
    user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment, reaction: str
):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCommentReacted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCommentReacted,
        {**create_comment_data(user_or_bot, project, card, comment), "reaction_type": reaction},
        project,
    )


@BotTaskDataHelper.card_schema(BotTriggerCondition.CardCommentUnreacted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_comment_unreacted(
    user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment, reaction: str
):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.CardCommentUnreacted)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardCommentUnreacted,
        {**create_comment_data(user_or_bot, project, card, comment), "reaction_type": reaction},
        project,
    )


def create_comment_data(user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_card(user_or_bot, project, card),
        "comment": comment.api_response(),
    }
