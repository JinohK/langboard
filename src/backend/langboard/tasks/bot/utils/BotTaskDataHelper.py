from typing import Any
from ....core.ai import Bot
from ....core.db import DbSession, SqlBuilder, User
from ....core.utils.decorators import staticclass
from ....models import Card, Project, ProjectWiki, ProjectWikiAssignedBot


@staticclass
class BotTaskDataHelper:
    @staticmethod
    def create_project(user_or_bot: User | Bot, project: Project) -> dict[str, Any]:
        return {"project": project.api_response(), "executor": BotTaskDataHelper.create_user_or_bot(user_or_bot)}

    @staticmethod
    def create_card(user_or_bot: User | Bot, project: Project, card: Card) -> dict[str, Any]:
        return {
            "project": project.api_response(),
            "card": card.api_response(),
            "executor": BotTaskDataHelper.create_user_or_bot(user_or_bot),
        }

    @staticmethod
    def create_user_or_bot(user_or_bot: User | Bot) -> dict[str, Any]:
        response = user_or_bot.api_response()
        if isinstance(user_or_bot, Bot):
            response.pop("as_user")
        return response

    @staticmethod
    async def create_private_wiki(
        runner_bot: Bot, user_or_bot: User | Bot, project: Project, wiki: ProjectWiki
    ) -> dict[str, Any] | None:
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectWikiAssignedBot).where(
                    (ProjectWikiAssignedBot.column("project_wiki_id") == wiki.id)
                    & (ProjectWikiAssignedBot.column("bot_id") == runner_bot.id)
                )
            )
        is_assigned = bool(result.first())
        if not is_assigned:
            return None
        return {
            **BotTaskDataHelper.create_project(user_or_bot, project),
            "project_wiki": wiki.convert_to_private_api_response(),
        }
