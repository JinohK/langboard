from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Project, ProjectWiki
from .utils import BotTaskDataHelper, BotTaskHelper


@Broker.wrap_async_task_decorator
async def project_wiki_created(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    await _run_wiki_task(BotTriggerCondition.WikiCreated, user_or_bot, project, wiki)


@Broker.wrap_async_task_decorator
async def project_wiki_updated(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    await _run_wiki_task(BotTriggerCondition.WikiUpdated, user_or_bot, project, wiki)


@Broker.wrap_async_task_decorator
async def project_wiki_publicity_changed(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    await _run_wiki_task(BotTriggerCondition.WikiPublicityChanged, user_or_bot, project, wiki)


@Broker.wrap_async_task_decorator
async def project_wiki_deleted(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    await _run_wiki_task(BotTriggerCondition.WikiDeleted, user_or_bot, project, wiki)


async def _run_wiki_task(condition: BotTriggerCondition, user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    bots = await BotTaskHelper.get_project_assigned_bots(project, condition)
    if wiki.is_public:
        await BotTaskHelper.run(bots, condition, create_wiki_data(user_or_bot, project, wiki), project)
        return
    for bot in bots:
        data = await BotTaskDataHelper.create_private_wiki(bot, user_or_bot, project, wiki)
        if data is not None:
            await BotTaskHelper.run(bot, condition, data, project)


def create_wiki_data(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_project(user_or_bot, project),
        "project_wiki": wiki.api_response(),
    }
