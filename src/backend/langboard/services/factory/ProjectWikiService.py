from typing import Any, Literal, cast, overload
from ...core.ai import Bot
from ...core.db import SnowflakeID, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...core.storage import FileModel
from ...models import Project, ProjectWiki, ProjectWikiAssignedBot, ProjectWikiAssignedUser, ProjectWikiAttachment
from ...tasks import ProjectWikiTask
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

    async def get_board_list(self, user_or_bot: TUserOrBot, project: TProjectParam) -> list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectWiki)
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
        result = await self._db.exec(
            self._db.query("select")
            .tables(Bot, ProjectWikiAssignedBot)
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
        result = await self._db.exec(
            self._db.query("select")
            .tables(User, ProjectWikiAssignedUser)
            .join(ProjectWikiAssignedUser, User.column("id") == ProjectWikiAssignedUser.column("user_id"))
            .where(ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
        )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def is_assigned(self, user: User, project_wiki: TWikiParam) -> bool:
        project_wiki = cast(ProjectWiki, await self._get_by_param(ProjectWiki, project_wiki))
        if not project_wiki:
            return False

        if project_wiki.is_public or user.is_admin:
            return True

        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectWikiAssignedUser)
            .where(
                (ProjectWikiAssignedUser.column("project_wiki_id") == project_wiki.id)
                & (ProjectWikiAssignedUser.column("user_id") == user.id)
            )
            .limit(1)
        )
        return bool(result.first())

    async def create(
        self, user_or_bot: TUserOrBot, project: TProjectParam, title: str
    ) -> tuple[ProjectWiki, dict[str, Any]] | None:
        params = await self.__get_records_by_params(project)
        if not params:
            return None
        project, _ = params

        max_order = await self._get_max_order(ProjectWiki, "project_id", project.id)

        wiki = ProjectWiki(
            project_id=project.id,
            title=title,
            order=max_order + 1,
        )
        self._db.insert(wiki)
        await self._db.commit()

        api_wiki = wiki.api_response()
        api_wiki["assigned_members"] = []
        model = {"wiki": api_wiki}
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:created:{project.get_uid()}",
            data_keys="wiki",
        )

        SocketPublishService.put_dispather(model, publish_model)

        ProjectWikiTask.project_wiki_created(user_or_bot, project, wiki)

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
            if old_value == new_value:
                continue
            old_wiki_record[key] = self._convert_to_python(old_value)
            setattr(wiki, key, new_value)

        if not old_wiki_record:
            return True

        await self._db.update(wiki)
        await self._db.commit()

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_wiki_record:
                continue
            model[key] = self._convert_to_python(getattr(wiki, key))

        topic_id = project.get_uid()
        wiki_uid = wiki.get_uid()
        if wiki.is_public:
            publish_model = SocketPublishModel(
                topic=SocketTopic.BoardWiki,
                topic_id=topic_id,
                event=f"board:wiki:details:changed:{wiki_uid}",
                data_keys=list(model.keys()),
            )
        else:
            publish_model = SocketPublishModel(
                topic=SocketTopic.BoardWikiPrivate,
                topic_id=wiki_uid,
                event=f"board:wiki:details:changed:{wiki_uid}",
                data_keys=list(model.keys()),
            )

        SocketPublishService.put_dispather(model, publish_model)

        notification_service = self._get_service(NotificationService)
        if "content" in model:
            await notification_service.notify_mentioned_at_wiki(user_or_bot, project, wiki)

        ProjectWikiTask.project_wiki_updated(user_or_bot, project, old_wiki_record, wiki)

        return model

    async def change_public(
        self, user_or_bot: TUserOrBot, project: TProjectParam, wiki: TWikiParam, is_public: bool
    ) -> tuple[ProjectWiki, Project, list[User]] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        if is_public:
            await self._db.exec(
                self._db.query("delete")
                .table(ProjectWikiAssignedBot)
                .where(ProjectWikiAssignedBot.column("project_wiki_id") == wiki.id)
            )
            await self._db.exec(
                self._db.query("delete")
                .table(ProjectWikiAssignedUser)
                .where(ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
            )
        else:
            if isinstance(user_or_bot, User):
                assigned_user = ProjectWikiAssignedUser(
                    project_wiki_id=wiki.id,
                    user_id=user_or_bot.id,
                )

                self._db.insert(assigned_user)
        await self._db.commit()

        was_public = wiki.is_public
        wiki.is_public = is_public

        await self._db.update(wiki)
        await self._db.commit()

        assigned_users = [user_or_bot] if not wiki.is_public and isinstance(user_or_bot, User) else []

        model = {
            "wiki": {
                **wiki.api_response(),
                "assigned_members": [assigned_user.api_response() for assigned_user in assigned_users],
                "assigned_bots": [],
            },
        }
        wiki_uid = wiki.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:public:changed:{wiki_uid}",
            data_keys="wiki",
        )

        SocketPublishService.put_dispather(model, publish_model)

        ProjectWikiTask.project_wiki_publicity_changed(user_or_bot, project, was_public, wiki)

        return wiki, project, assigned_users

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

        await self._db.exec(
            self._db.query("delete")
            .table(ProjectWikiAssignedBot)
            .where(ProjectWikiAssignedBot.column("project_wiki_id") == wiki.id)
        )
        await self._db.exec(
            self._db.query("delete")
            .table(ProjectWikiAssignedUser)
            .where(ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
        )

        bots: list[Bot] = []
        target_users: list[User] = []
        if assign_user_or_bot_uids:
            assignee_ids = [SnowflakeID.from_short_code(uid) for uid in assign_user_or_bot_uids]
            project_service = self._get_service(ProjectService)
            raw_bots = await project_service.get_assigned_bots(project.id, as_api=False, where_bot_ids_in=assignee_ids)
            raw_users = await project_service.get_assigned_users(
                project.id, as_api=False, where_user_ids_in=assignee_ids
            )

            for target_bot, project_assigned_bot in raw_bots:
                self._db.insert(
                    ProjectWikiAssignedBot(
                        project_assigned_id=project_assigned_bot.id, project_wiki_id=wiki.id, bot_id=target_bot.id
                    )
                )
                bots.append(target_bot)
            for target_user, project_assigned_user in raw_users:
                self._db.insert(
                    ProjectWikiAssignedUser(
                        project_assigned_id=project_assigned_user.id, project_wiki_id=wiki.id, user_id=target_user.id
                    )
                )
                target_users.append(target_user)
        await self._db.commit()

        model = {
            "assigned_bots": [bot.api_response() for bot in bots],
            "assigned_members": [target_user.api_response() for target_user in target_users],
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:assignees:updated:{wiki.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

        ProjectWikiTask.project_wiki_assignees_updated(
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

        for index, all_wiki in enumerate(all_wikis):
            all_wiki.order = index
            await self._db.update(all_wiki)

        await self._db.commit()

        model = {
            "uid": wiki.get_uid(),
            "order": wiki.order,
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:order:changed:{project.get_uid()}",
            data_keys=["uid", "order"],
        )

        SocketPublishService.put_dispather(model, publish_model)

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

        self._db.insert(wiki_attachment)
        await self._db.commit()

        return wiki_attachment

    async def delete(self, user: User, project: TProjectParam, wiki: TWikiParam) -> None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        await self._db.delete(wiki)
        await self._db.commit()

        model = {"uid": wiki.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:deleted:{project.get_uid()}",
            data_keys=["uid"],
        )

        SocketPublishService.put_dispather(model, publish_model)

        ProjectWikiTask.project_wiki_deleted(user, project, wiki)

        return None

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
