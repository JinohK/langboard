from typing import Any, Literal, cast, overload
from ...core.ai import Bot
from ...core.db import DbSession, EditorContentModel, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService
from ...core.storage import FileModel
from ...core.utils.Converter import convert_python_data
from ...models import (
    Project,
    ProjectAssignedBot,
    ProjectAssignedUser,
    ProjectWiki,
    ProjectWikiAssignedBot,
    ProjectWikiAssignedUser,
    ProjectWikiAttachment,
)
from ...publishers import ProjectWikiPublisher
from ...tasks.activities import ProjectWikiActivityTask
from ...tasks.bot import ProjectWikiBotTask
from .NotificationService import NotificationService
from .ProjectService import ProjectService
from .Types import TProjectParam, TUserOrBot, TWikiParam


class ProjectWikiService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_wiki"

    async def get_by_uid(self, uid: str) -> ProjectWiki | None:
        return await self._get_by_param(ProjectWiki, uid)

    async def get_all_by_project(self, project: TProjectParam) -> list[ProjectWiki]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        return list(await self._get_all_by(ProjectWiki, "project_id", project.id))

    async def get_board_list(self, user_or_bot: TUserOrBot, project: TProjectParam) -> list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectWiki)
                .where(ProjectWiki.column("project_id") == project.id)
                .order_by(ProjectWiki.column("order").asc())
                .group_by(ProjectWiki.column("id"), ProjectWiki.column("order"))
            )
        raw_wikis = result.all()

        wikis = [await self.convert_to_api_response(user_or_bot, raw_wiki) for raw_wiki in raw_wikis]

        return wikis

    async def convert_to_api_response(self, user_or_bot: TUserOrBot, wiki: ProjectWiki) -> dict[str, Any]:
        api_wiki = wiki.api_response()
        api_wiki["assigned_bots"] = []
        api_wiki["assigned_members"] = []
        if wiki.is_public:
            return api_wiki

        assigned_bots = await self.get_assigned_bots(wiki, as_api=False)
        assigned_bot_ids = [assigned_bot.id for assigned_bot, _ in assigned_bots]
        assigned_users = await self.get_assigned_users(wiki, as_api=False)
        assigned_user_ids = [assigned_user.id for assigned_user, _ in assigned_users]

        is_showable = (
            wiki.is_public
            or (isinstance(user_or_bot, User) and (user_or_bot.is_admin or user_or_bot.id in assigned_user_ids))
            or (isinstance(user_or_bot, Bot) and user_or_bot.id in assigned_bot_ids)
        )

        if is_showable:
            api_wiki["assigned_bots"] = [assigned_bot.api_response() for assigned_bot, _ in assigned_bots]
            api_wiki["assigned_members"] = [assigned_user.api_response() for assigned_user, _ in assigned_users]
        else:
            api_wiki = wiki.convert_to_private_api_response()

        return api_wiki

    @overload
    async def get_assigned_bots(
        self, wiki: TWikiParam, as_api: Literal[False]
    ) -> list[tuple[Bot, ProjectWikiAssignedBot]]: ...
    @overload
    async def get_assigned_bots(self, wiki: TWikiParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_bots(
        self, wiki: TWikiParam, as_api: bool
    ) -> list[tuple[Bot, ProjectWikiAssignedBot]] | list[dict[str, Any]]:
        wiki = cast(ProjectWiki, await self._get_by_param(ProjectWiki, wiki))
        if not wiki:
            return []
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.tables(Bot, ProjectWikiAssignedBot)
                .join(ProjectWikiAssignedBot, Bot.column("id") == ProjectWikiAssignedBot.column("bot_id"))
                .where(ProjectWikiAssignedBot.column("project_wiki_id") == wiki.id)
            )
        raw_bots = result.all()
        if not as_api:
            return list(raw_bots)

        bots = [bot.api_response() for bot, _ in raw_bots]
        return bots

    @overload
    async def get_assigned_users(
        self, wiki: TWikiParam, as_api: Literal[False]
    ) -> list[tuple[User, ProjectWikiAssignedUser]]: ...
    @overload
    async def get_assigned_users(self, wiki: TWikiParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_users(
        self, wiki: TWikiParam, as_api: bool
    ) -> list[tuple[User, ProjectWikiAssignedUser]] | list[dict[str, Any]]:
        wiki = cast(ProjectWiki, await self._get_by_param(ProjectWiki, wiki))
        if not wiki:
            return []
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.tables(User, ProjectWikiAssignedUser)
                .join(ProjectWikiAssignedUser, User.column("id") == ProjectWikiAssignedUser.column("user_id"))
                .where(ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
            )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def is_assigned(self, user_or_bot: TUserOrBot, project_wiki: TWikiParam) -> bool:
        project_wiki = cast(ProjectWiki, await self._get_by_param(ProjectWiki, project_wiki))
        if not project_wiki:
            return False

        if project_wiki.is_public:
            return True

        if isinstance(user_or_bot, Bot):
            model_table = ProjectWikiAssignedBot
            column_name = "bot_id"
        else:
            if user_or_bot.is_admin:
                return True

            model_table = ProjectWikiAssignedUser
            column_name = "user_id"

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(model_table)
                .where(
                    (model_table.column("project_wiki_id") == project_wiki.id)
                    & (model_table.column(column_name) == user_or_bot.id)
                )
                .limit(1)
            )
        return bool(result.first())

    async def create(
        self, user_or_bot: TUserOrBot, project: TProjectParam, title: str, content: EditorContentModel | None = None
    ) -> tuple[ProjectWiki, dict[str, Any]] | None:
        params = await self.__get_records_by_params(project)
        if not params:
            return None
        project, _ = params

        max_order = await self._get_max_order(ProjectWiki, "project_id", project.id)

        wiki = ProjectWiki(
            project_id=project.id,
            title=title,
            content=content or EditorContentModel(),
            order=max_order + 1,
        )
        async with DbSession.use() as db:
            db.insert(wiki)
            await db.commit()

        api_wiki = wiki.api_response()
        api_wiki["assigned_bots"] = []
        api_wiki["assigned_members"] = []
        ProjectWikiPublisher.created(project, wiki)
        ProjectWikiActivityTask.project_wiki_created(user_or_bot, project, wiki)
        ProjectWikiBotTask.project_wiki_created(user_or_bot, project, wiki)

        return wiki, api_wiki

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, wiki: TWikiParam, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        mutable_keys = ["title", "content"]

        old_wiki_record = {}
        for key in mutable_keys:
            if key not in form or not hasattr(wiki, key):
                continue
            old_value = getattr(wiki, key)
            new_value = form[key]
            if old_value == new_value or (key == "title" and not new_value):
                continue
            old_wiki_record[key] = convert_python_data(old_value)
            setattr(wiki, key, new_value)

        if not old_wiki_record:
            return True

        async with DbSession.use() as db:
            await db.update(wiki)
            await db.commit()

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_wiki_record:
                continue
            model[key] = convert_python_data(getattr(wiki, key))

        ProjectWikiPublisher.updated(project, wiki, model)

        notification_service = self._get_service(NotificationService)
        if "content" in model:
            await notification_service.notify_mentioned_in_wiki(user_or_bot, project, wiki)

        ProjectWikiActivityTask.project_wiki_updated(user_or_bot, project, old_wiki_record, wiki)
        ProjectWikiBotTask.project_wiki_updated(user_or_bot, project, old_wiki_record, wiki)

        return model

    async def change_public(
        self, user_or_bot: TUserOrBot, project: TProjectParam, wiki: TWikiParam, is_public: bool
    ) -> tuple[ProjectWiki, Project] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        if is_public:
            async with DbSession.use() as db:
                await db.exec(
                    SqlBuilder.delete.table(ProjectWikiAssignedBot).where(
                        ProjectWikiAssignedBot.column("project_wiki_id") == wiki.id
                    )
                )
                await db.commit()

            async with DbSession.use() as db:
                await db.exec(
                    SqlBuilder.delete.table(ProjectWikiAssignedUser).where(
                        ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id
                    )
                )
                await db.commit()
        else:
            if isinstance(user_or_bot, Bot):
                project_assigned_table = ProjectAssignedBot
                model_table = ProjectWikiAssignedBot
                column_name = "bot_id"
            else:
                project_assigned_table = ProjectAssignedUser
                model_table = ProjectWikiAssignedUser
                column_name = "user_id"

            async with DbSession.use() as db:
                result = await db.exec(
                    SqlBuilder.select.table(project_assigned_table).where(
                        (project_assigned_table.column("project_id") == project.id)
                        & (project_assigned_table.column(column_name) == user_or_bot.id)
                    )
                )
            project_assigned = result.first()
            if not project_assigned:
                return None

            model_params: dict[str, Any] = {
                "project_assigned_id": project_assigned.id,
                "project_wiki_id": wiki.id,
            }
            model_params[column_name] = user_or_bot.id
            async with DbSession.use() as db:
                db.insert(model_table(**model_params))
                await db.commit()

        was_public = wiki.is_public
        wiki.is_public = is_public

        async with DbSession.use() as db:
            await db.update(wiki)
            await db.commit()

        ProjectWikiPublisher.publicity_changed(user_or_bot, project, wiki)
        ProjectWikiActivityTask.project_wiki_publicity_changed(user_or_bot, project, was_public, wiki)
        ProjectWikiBotTask.project_wiki_publicity_changed(user_or_bot, project, wiki)

        return wiki, project

    async def update_assignees(
        self, user: User, project: TProjectParam, wiki: TWikiParam, assign_user_or_bot_uids: list[str]
    ) -> tuple[ProjectWiki, Project] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params
        if wiki.is_public:
            return None

        original_assigned_bots = await self.get_assigned_bots(wiki, as_api=False)
        original_assigned_users = await self.get_assigned_users(wiki, as_api=False)

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(ProjectWikiAssignedBot).where(
                    ProjectWikiAssignedBot.column("project_wiki_id") == wiki.id
                )
            )
            await db.commit()

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(ProjectWikiAssignedUser).where(
                    ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id
                )
            )
            await db.commit()

        bots: list[Bot] = []
        target_users: list[User] = []
        if assign_user_or_bot_uids:
            assignee_ids = [SnowflakeID.from_short_code(uid) for uid in assign_user_or_bot_uids]
            project_service = self._get_service(ProjectService)
            raw_bots = await project_service.get_assigned_bots(project.id, as_api=False, where_bot_ids_in=assignee_ids)
            raw_users = await project_service.get_assigned_users(
                project.id, as_api=False, where_user_ids_in=assignee_ids
            )

            async with DbSession.use() as db:
                for target_bot, project_assigned_bot in raw_bots:
                    db.insert(
                        ProjectWikiAssignedBot(
                            project_assigned_id=project_assigned_bot.id, project_wiki_id=wiki.id, bot_id=target_bot.id
                        )
                    )
                    bots.append(target_bot)
                for target_user, project_assigned_user in raw_users:
                    db.insert(
                        ProjectWikiAssignedUser(
                            project_assigned_id=project_assigned_user.id,
                            project_wiki_id=wiki.id,
                            user_id=target_user.id,
                        )
                    )
                    target_users.append(target_user)
                await db.commit()

        ProjectWikiPublisher.assignees_updated(project, wiki, bots, target_users)
        ProjectWikiActivityTask.project_wiki_assignees_updated(
            user,
            project,
            wiki,
            [bot.id for bot, _ in original_assigned_bots],
            [bot.id for bot in bots],
            [target_user.id for target_user, _ in original_assigned_users],
            [target_user.id for target_user in target_users],
        )

        return wiki, project

    async def change_order(
        self, project: TProjectParam, wiki: TWikiParam, order: int
    ) -> tuple[Project, ProjectWiki] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        all_wikis = [
            all_wiki
            for all_wiki in await self._get_all_by(ProjectWiki, "project_id", project.id)
            if all_wiki.id != wiki.id
        ]
        all_wikis = [*all_wikis[:order], wiki, *all_wikis[order:]]

        async with DbSession.use() as db:
            for index, all_wiki in enumerate(all_wikis):
                all_wiki.order = index
                await db.update(all_wiki)
            await db.commit()

        ProjectWikiPublisher.order_changed(project, wiki)

        return project, wiki

    async def upload_attachment(
        self, user: User, project: TProjectParam, wiki: TWikiParam, attachment: FileModel
    ) -> ProjectWikiAttachment | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        max_order = await self._get_max_order(ProjectWikiAttachment, "wiki_id", wiki.id)

        wiki_attachment = ProjectWikiAttachment(
            user_id=user.id,
            wiki_id=wiki.id,
            filename=attachment.original_filename,
            file=attachment,
            order=max_order + 1,
        )

        async with DbSession.use() as db:
            db.insert(wiki_attachment)
            await db.commit()

        return wiki_attachment

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, wiki: TWikiParam) -> bool:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return False
        project, wiki = params

        async with DbSession.use() as db:
            await db.delete(wiki)
            await db.commit()

        ProjectWikiPublisher.deleted(project, wiki)
        ProjectWikiActivityTask.project_wiki_deleted(user_or_bot, project, wiki)
        ProjectWikiBotTask.project_wiki_deleted(user_or_bot, project, wiki)

        return True

    @overload
    async def __get_records_by_params(self, project: TProjectParam) -> tuple[Project, None] | None: ...
    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, wiki: TWikiParam
    ) -> tuple[Project, ProjectWiki] | None: ...
    async def __get_records_by_params(  # type: ignore
        self, project: TProjectParam, wiki: TWikiParam | None = None
    ):
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        if wiki:
            wiki = cast(ProjectWiki, await self._get_by_param(ProjectWiki, wiki))
            if not wiki or wiki.project_id != project.id:
                return None
        else:
            wiki = None

        return project, wiki
