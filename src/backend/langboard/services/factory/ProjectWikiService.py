from typing import Any, Literal, cast, overload
from ...core.ai import BotType
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...core.storage import FileModel
from ...models import Project, ProjectWiki, ProjectWikiAssignedUser, ProjectWikiAttachment, User
from .ProjectService import ProjectService
from .RevertService import RevertService, RevertType
from .Types import TProjectParam, TWikiParam


class ProjectWikiService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_wiki"

    async def get_by_uid(self, uid: str) -> ProjectWiki | None:
        return await self._get_by(ProjectWiki, "uid", uid)

    async def get_board_list(self, user: User, project_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectWiki)
            .join(Project, ProjectWiki.column("project_id") == Project.id)
            .where(Project.column("uid") == project_uid)
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
                api_wiki = self.convert_to_private_api_response(raw_wiki)

            wikis.append(api_wiki)

        return wikis

    @overload
    async def get_assigned_users(
        self, wiki: ProjectWiki | int, as_api: Literal[False]
    ) -> list[tuple[User, ProjectWikiAssignedUser]]: ...
    @overload
    async def get_assigned_users(self, wiki: ProjectWiki | int, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_users(
        self, wiki: ProjectWiki | int, as_api: bool
    ) -> list[tuple[User, ProjectWikiAssignedUser]] | list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(User, ProjectWikiAssignedUser)
            .join(ProjectWikiAssignedUser, User.column("id") == ProjectWikiAssignedUser.column("user_id"))
            .where(
                ProjectWikiAssignedUser.column("project_wiki_id")
                == (wiki.id if isinstance(wiki, ProjectWiki) else wiki)
            )
        )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user, _ in raw_users]
        return users

    def convert_to_private_api_response(self, wiki: ProjectWiki) -> dict[str, Any]:
        return {
            "uid": wiki.uid,
            "title": "",
            "content": None,
            "order": wiki.order,
            "is_public": False,
            "forbidden": True,
            "assigned_members": [],
        }

    async def create(
        self, user: User, project: TProjectParam, title: str
    ) -> SocketModelIdBaseResult[tuple[ProjectWiki, dict[str, Any]]] | None:
        params = await self.__get_records_by_params(project)
        if not params:
            return None
        project, _ = params

        max_order = await self._get_max_order(ProjectWiki, "project_id", project.id)

        wiki = ProjectWiki(
            project_id=cast(int, project.id),
            title=title,
            order=max_order + 1,
        )
        self._db.insert(wiki)
        await self._db.commit()

        api_wiki = wiki.api_response()
        api_wiki["assigned_members"] = []
        model_id = await SocketModelIdService.create_model_id({"wiki": api_wiki})
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.uid,
            event=f"board:wiki:created:{project.uid}",
            data_keys="wiki",
        )

        return SocketModelIdBaseResult(model_id, (wiki, api_wiki), publish_model)

    async def update(
        self, user_or_bot: User | BotType, project: TProjectParam, wiki: TWikiParam, form: dict
    ) -> SocketModelIdBaseResult[tuple[str | None, dict[str, Any]]] | Literal[True] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        mutable_keys = ["title", "content"]

        old_card_record = {}
        for key in mutable_keys:
            if key not in form or not hasattr(wiki, key):
                continue
            old_value = getattr(wiki, key)
            new_value = form[key]
            if old_value == new_value:
                continue
            old_card_record[key] = self._convert_to_python(old_value)
            setattr(wiki, key, new_value)

        if not old_card_record:
            return True

        if isinstance(user_or_bot, BotType):
            await self._db.update(wiki)
            await self._db.commit()
            revert_key = None
        else:
            revert_service = self._get_service(RevertService)
            revert_key = await revert_service.record(revert_service.create_record_model(wiki, RevertType.Update))

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys:
                continue
            model[key] = self._convert_to_python(getattr(wiki, key))
        model_id = await SocketModelIdService.create_model_id(model)

        assigned_users = await self.get_assigned_users(wiki, as_api=False)

        publish_models: list[SocketPublishModel] = []
        for key in model:
            if wiki.is_public:
                publish_models.append(
                    SocketPublishModel(
                        topic=SocketTopic.BoardWiki,
                        topic_id=project.uid,
                        event=f"board:wiki:{key}:changed:{wiki.uid}",
                        data_keys=key,
                    )
                )
            else:
                for assigned_user, _ in assigned_users:
                    publish_models.append(
                        SocketPublishModel(
                            topic=SocketTopic.BoardWikiPrivate,
                            topic_id=assigned_user.username,
                            event=f"board:wiki:{key}:changed:{wiki.uid}",
                            data_keys=key,
                        )
                    )

        return SocketModelIdBaseResult(model_id, (revert_key, model), publish_models)

    async def change_public(
        self, user: User, project: TProjectParam, wiki: TWikiParam, is_public: bool
    ) -> SocketModelIdBaseResult[tuple[ProjectWiki, Project, list[User]]] | None:
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
            assigned_user = ProjectWikiAssignedUser(
                project_wiki_id=cast(int, wiki.id),
                user_id=cast(int, user.id),
            )

            self._db.insert(assigned_user)

        await self._db.update(wiki)
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id(
            {
                "fake": True,
            }
        )

        public_wiki = {
            **wiki.api_response(),
            "assigned_members": [user.api_response()] if not wiki.is_public else [],
        }
        private_wiki = self.convert_to_private_api_response(wiki)
        publish_models: list[SocketPublishModel] = []
        if wiki.is_public:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.BoardWiki,
                    topic_id=project.uid,
                    event=f"board:wiki:public:changed:{wiki.uid}",
                    extra_data={"wiki": public_wiki},
                )
            )
        else:
            project_service = self._get_service(ProjectService)
            project_members = await project_service.get_assigned_users(project, as_api=False)
            for project_member, _ in project_members:
                is_public_user = project_member.is_admin or project_member.id == user.id
                publish_models.append(
                    SocketPublishModel(
                        topic=SocketTopic.BoardWikiPrivate,
                        topic_id=project_member.username,
                        event=f"board:wiki:public:changed:{wiki.uid}",
                        extra_data={"wiki": public_wiki if is_public_user else private_wiki},
                    )
                )

        return SocketModelIdBaseResult(model_id, (wiki, project, [user] if not wiki.is_public else []), publish_models)

    async def update_assigned_users(
        self, user: User, project: TProjectParam, wiki: TWikiParam, assigned_user_ids: list[int]
    ) -> SocketModelIdBaseResult[tuple[ProjectWiki, Project]] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        project_service = self._get_service(ProjectService)
        project_assigned_users = await project_service.get_assigned_users(project, as_api=False)
        project_assigned_user_ids = [project_assigned_user.id for project_assigned_user, _ in project_assigned_users]

        prev_assigned_users = await self.get_assigned_users(wiki, as_api=False)

        await self._db.exec(
            self._db.query("delete")
            .table(ProjectWikiAssignedUser)
            .where(ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
        )

        for assigned_user_id in assigned_user_ids:
            if assigned_user_id not in project_assigned_user_ids:
                continue
            assigned_user = ProjectWikiAssignedUser(
                project_wiki_id=cast(int, wiki.id),
                user_id=assigned_user_id,
            )
            self._db.insert(assigned_user)

        await self._db.commit()

        assigned_users = await self.get_assigned_users(wiki, as_api=False)

        prev_cur_users = [prev_assigned_user for prev_assigned_user, _ in prev_assigned_users]
        prev_cur_user_ids = [prev_assigned_user.id for prev_assigned_user, _ in prev_assigned_users]
        for assigned_user, _ in assigned_users:
            if assigned_user.id in prev_cur_user_ids:
                continue
            prev_cur_users.append(assigned_user)
            prev_cur_user_ids.append(assigned_user.id)

        model_id = await SocketModelIdService.create_model_id(
            {
                "fake": True,
            }
        )

        public_wiki = {
            **wiki.api_response(),
            "assigned_members": [user.api_response()] if not wiki.is_public else [],
        }
        private_wiki = self.convert_to_private_api_response(wiki)
        publish_models: list[SocketPublishModel] = []
        for prev_cur_user in prev_cur_users:
            is_public_user = prev_cur_user.is_admin or prev_cur_user.id in assigned_user_ids
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.BoardWikiPrivate,
                    topic_id=prev_cur_user.username,
                    event=f"board:wiki:assigned-users:changed:{wiki.uid}",
                    extra_data={"wiki": public_wiki if is_public_user else private_wiki},
                )
            )

        return SocketModelIdBaseResult(model_id, (wiki, project), publish_models)

    async def change_order(
        self, project: TProjectParam, wiki: TWikiParam, order: int
    ) -> SocketModelIdBaseResult[tuple[Project, ProjectWiki]] | None:
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

        model_id = await SocketModelIdService.create_model_id({"uid": wiki.uid, "order": wiki.order})

        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.uid,
            event=f"board:wiki:order:changed:{project.uid}",
            data_keys=["uid", "order"],
        )

        return SocketModelIdBaseResult(model_id, (project, wiki), publish_model)

    async def upload_attachment(
        self, user: User, project: TProjectParam, wiki: TWikiParam, attachment: FileModel
    ) -> SocketModelIdBaseResult[ProjectWikiAttachment] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        max_order = await self._get_max_order(ProjectWikiAttachment, "wiki_uid", wiki.uid)

        wiki_attachment = ProjectWikiAttachment(
            user_id=cast(int, user.id),
            wiki_uid=wiki.uid,
            filename=attachment.original_filename,
            file=attachment,
            order=max_order + 1,
        )

        self._db.insert(wiki_attachment)
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id(
            {"attachment": {**wiki_attachment.api_response(), "user": user.api_response(), "wiki_uid": wiki.uid}}
        )

        return SocketModelIdBaseResult(model_id, wiki_attachment, [])

    async def delete(
        self, user: User, project: TProjectParam, wiki: TWikiParam
    ) -> SocketModelIdBaseResult[None] | None:
        params = await self.__get_records_by_params(project, wiki)
        if not params:
            return None
        project, wiki = params

        await self._db.delete(wiki)
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id({"uid": wiki.uid})

        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.uid,
            event=f"board:wiki:deleted:{project.uid}",
            data_keys=["uid"],
        )

        return SocketModelIdBaseResult(model_id, None, publish_model)

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

        wiki = None
        if wiki:
            wiki = cast(ProjectWiki, await self._get_by_param(ProjectWiki, wiki))
            if not wiki or wiki.project_id != project.id:
                return None

        return project, wiki
