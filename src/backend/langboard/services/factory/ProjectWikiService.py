from typing import Any, Literal, cast, overload
from ...core.db import SnowflakeID, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...core.storage import FileModel
from ...models import Project, ProjectWiki, ProjectWikiAssignedUser, ProjectWikiAttachment
from .ProjectService import ProjectService
from .RevertService import RevertService, RevertType
from .Types import TProjectParam, TUserOrBot, TWikiParam


class ProjectWikiService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_wiki"

    async def get_by_uid(self, uid: str) -> ProjectWiki | None:
        return await self._get_by_param(ProjectWiki, uid)

    async def get_board_list(self, user: User, project: TProjectParam) -> list[dict[str, Any]]:
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

        wikis = []
        for raw_wiki in raw_wikis:
            api_wiki = raw_wiki.api_response()
            api_wiki["assigned_members"] = []
            if raw_wiki.is_public:
                wikis.append(api_wiki)
                continue

            assigned_users = await self.get_assigned_users(raw_wiki, as_api=False)
            assigned_user_ids = [assigned_user.id for assigned_user, _ in assigned_users]

            if raw_wiki.is_public or user.is_admin or user.id in assigned_user_ids:
                api_wiki["assigned_members"] = [assigned_user.api_response() for assigned_user, _ in assigned_users]
            else:
                api_wiki = raw_wiki.convert_to_private_api_response()

            wikis.append(api_wiki)

        return wikis

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

        if project_wiki.is_public:
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

        return wiki, api_wiki

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, wiki: TWikiParam, form: dict
    ) -> tuple[str | None, dict[str, Any]] | Literal[True] | None:
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

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(revert_service.create_record_model(wiki, RevertType.Update))

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_wiki_record:
                continue
            model[key] = self._convert_to_python(getattr(wiki, key))

        topic_id = project.get_uid()
        wiki_uid = wiki.get_uid()
        publish_models: list[SocketPublishModel] = []
        if wiki.is_public:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.BoardWiki,
                    topic_id=topic_id,
                    event=f"board:wiki:details:changed:{wiki_uid}",
                    data_keys=list(model.keys()),
                )
            )
        else:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.BoardWikiPrivate,
                    topic_id=wiki_uid,
                    event=f"board:wiki:details:changed:{wiki_uid}",
                    data_keys=list(model.keys()),
                )
            )

        SocketPublishService.put_dispather(model, publish_models)

        return revert_key, model

    async def change_public(
        self, user_or_bot: TUserOrBot, project: TProjectParam, wiki: TWikiParam, is_public: bool
    ) -> tuple[ProjectWiki, Project, list[User]] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        wiki.is_public = is_public
        if wiki.is_public:
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

        await self._db.update(wiki)
        await self._db.commit()

        assigned_users = [user_or_bot] if not wiki.is_public and isinstance(user_or_bot, User) else []

        model = {
            "wiki": {
                **wiki.api_response(),
                "assigned_members": [user.api_response() for user in assigned_users],
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

        return wiki, project, assigned_users

    async def update_assigned_users(
        self, user_or_bot: TUserOrBot, project: TProjectParam, wiki: TWikiParam, assign_user_uids: list[str]
    ) -> tuple[ProjectWiki, Project] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params
        if wiki.is_public:
            return None

        # result = await self._db.exec(
        #     self._db.query("select").column(ProjectWikiAssignedUser.user_id).where(ProjectWikiAssignedUser.card_id == card.id)
        # )
        # original_assigned_user_ids = list(result.all())

        await self._db.exec(
            self._db.query("delete")
            .table(ProjectWikiAssignedUser)
            .where(ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
        )

        if assign_user_uids:
            assigned_user_ids = [SnowflakeID.from_short_code(uid) for uid in assign_user_uids]
            project_service = self._get_service(ProjectService)
            raw_users = await project_service.get_assigned_users(
                project.id, as_api=False, where_user_ids_in=assigned_user_ids
            )
            users: list[User] = []
            for user, project_assigned_user in raw_users:
                self._db.insert(
                    ProjectWikiAssignedUser(
                        project_assigned_id=project_assigned_user.id, project_wiki_id=wiki.id, user_id=user.id
                    )
                )
                users.append(user)
        else:
            users = []
        await self._db.commit()

        wiki_uid = wiki.get_uid()
        model = {
            "wiki_uid": wiki_uid,
            "assigned_members": [user.api_response() for user in users],
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:assigned-users:changed:{wiki_uid}",
            data_keys="assigned_members",
        )

        SocketPublishService.put_dispather(model, publish_model)

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

        # model = {
        #     "attachment": {
        #         **wiki_attachment.api_response(),
        #         "user": user.api_response(),
        #         "wiki_uid": wiki.get_uid(),
        #     }
        # }
        # SocketPublishService.put_dispather(model, publish_model)

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
