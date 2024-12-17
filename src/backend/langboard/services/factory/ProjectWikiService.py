from typing import Any, Sequence, cast
from pydantic import BaseModel
from ...core.ai import BotType
from ...core.db import EditorContentModel
from ...core.service import BaseService, ModelIdBaseResult, ModelIdService
from ...core.storage import FileModel
from ...models import Project, ProjectWiki, ProjectWikiAssignedUser, ProjectWikiAttachment, User
from .ProjectService import ProjectService
from .RevertService import RevertService, RevertType


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

            assigned_users = await self.get_assigned_users(raw_wiki)
            assigned_user_ids = [assigned_user.id for assigned_user in assigned_users]

            if raw_wiki.is_public or user.is_admin or user.id in assigned_user_ids:
                api_wiki["assigned_members"] = [assigned_user.api_response() for assigned_user in assigned_users]
            else:
                api_wiki = self.convert_to_private_api_response(raw_wiki)

            wikis.append(api_wiki)

        return wikis

    async def get_assigned_users(self, wiki: ProjectWiki) -> Sequence[User]:
        result = await self._db.exec(
            self._db.query("select")
            .table(User)
            .join(ProjectWikiAssignedUser, User.column("id") == ProjectWikiAssignedUser.column("user_id"))
            .where(ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
        )
        return result.all()

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

    async def create(self, user: User, project_uid: str, title: str) -> tuple[ProjectWiki, dict[str, Any]] | None:
        project = await self._get_by(Project, "uid", project_uid)
        if not project:
            return None

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

        return wiki, api_wiki

    async def update(
        self, user_or_bot: User | BotType, wiki: ProjectWiki | int, form: dict
    ) -> ModelIdBaseResult[tuple[bool, str | None, list[User]]] | None:
        if isinstance(wiki, int):
            wiki = cast(ProjectWiki, await self._get_by(ProjectWiki, "id", wiki))
            if not wiki:
                return None

        for immutable_key in ["id", "uid", "project_id"]:
            if immutable_key in form:
                form.pop(immutable_key)

        old_card_record = {}

        for key, value in form.items():
            if hasattr(wiki, key):
                old_card_record[key] = getattr(wiki, key)
                if isinstance(old_card_record[key], BaseModel):
                    old_card_record[key] = old_card_record[key].model_dump()
                if old_card_record[key] == value:
                    continue
                setattr(wiki, key, value)

        if not old_card_record:
            return ModelIdBaseResult("", (False, None, []))

        if isinstance(user_or_bot, BotType):
            await self._db.update(wiki)
            await self._db.commit()
            revert_key = None
        else:
            revert_service = self._get_service(RevertService)
            revert_key = await revert_service.record(revert_service.create_record_model(wiki, RevertType.Update))

        model: dict[str, Any] = {}
        for key in form:
            model[key] = getattr(wiki, key)
            if isinstance(model[key], EditorContentModel):
                model[key] = model[key].model_dump()
        model_id = await ModelIdService.create_model_id(model)

        assigned_users = await self.get_assigned_users(wiki)

        return ModelIdBaseResult(model_id, (True, revert_key, list(assigned_users)))

    async def change_public(
        self, user: User, project_uid: str, wiki_uid: str, is_public: bool
    ) -> ModelIdBaseResult[tuple[ProjectWiki, Project, list[User]]] | None:
        wiki, project = await self.__get_with_project(project_uid, wiki_uid)
        if not wiki or not project:
            return None

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

        model_id = await ModelIdService.create_model_id(
            {
                "public": {
                    **wiki.api_response(),
                    "assigned_members": [user.api_response()] if not wiki.is_public else [],
                },
                "private": self.convert_to_private_api_response(wiki),
            }
        )

        return ModelIdBaseResult(model_id, (wiki, project, [user] if not wiki.is_public else []))

    async def update_assigned_users(
        self, user: User, project_uid: str, wiki_uid: str, assigned_user_ids: list[int]
    ) -> ModelIdBaseResult[tuple[ProjectWiki, Project, Sequence[User], Sequence[User]]] | None:
        wiki, project = await self.__get_with_project(project_uid, wiki_uid)
        if not wiki or not project:
            return None

        if wiki.is_public:
            return None

        project_service = self._get_service(ProjectService)
        project_assigned_users = await project_service.get_assigned_users(project, as_api=False)
        project_assigned_user_ids = [project_assigned_user.id for project_assigned_user in project_assigned_users]

        prev_assigned_users = await self.get_assigned_users(wiki)

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

        assigned_users = await self.get_assigned_users(wiki)

        model_id = await ModelIdService.create_model_id(
            {
                "public": {
                    **wiki.api_response(),
                    "assigned_members": [assigned_user.api_response() for assigned_user in assigned_users],
                },
                "private": self.convert_to_private_api_response(wiki),
            }
        )

        return ModelIdBaseResult(model_id, (wiki, project, prev_assigned_users, assigned_users))

    async def change_order(
        self, project_uid: str, wiki_uid: str, order: int
    ) -> ModelIdBaseResult[tuple[Project, ProjectWiki]] | None:
        target_wiki, project = await self.__get_with_project(project_uid, wiki_uid)
        if not target_wiki or not project:
            return None

        all_wikis = [
            wiki for wiki in await self._get_all_by(ProjectWiki, "project_id", project.id) if wiki.id != target_wiki.id
        ]
        all_wikis = [*all_wikis[:order], target_wiki, *all_wikis[order:]]

        for index, wiki in enumerate(all_wikis):
            wiki.order = index
            await self._db.update(wiki)

        await self._db.commit()

        model_id = await ModelIdService.create_model_id({"uid": wiki_uid, "order": target_wiki.order})

        return ModelIdBaseResult(model_id, (project, target_wiki))

    async def upload_attachment(
        self, user: User, project_uid: str, wiki_uid: str, attachment: FileModel
    ) -> ModelIdBaseResult[ProjectWikiAttachment] | None:
        wiki, project = await self.__get_with_project(project_uid, wiki_uid)
        if not wiki or not project:
            return None

        max_order = await self._get_max_order(ProjectWikiAttachment, "wiki_uid", wiki_uid)

        wiki_attachment = ProjectWikiAttachment(
            user_id=cast(int, user.id),
            wiki_uid=wiki.uid,
            filename=attachment.original_filename,
            file=attachment,
            order=max_order + 1,
        )

        self._db.insert(wiki_attachment)
        await self._db.commit()

        model_id = await ModelIdService.create_model_id(
            {"attachment": {**wiki_attachment.api_response(), "user": user.api_response(), "wiki_uid": wiki_uid}}
        )

        return ModelIdBaseResult(model_id, wiki_attachment)

    async def delete(self, user: User, project_uid: str, wiki_uid: str) -> bool:
        wiki, project = await self.__get_with_project(project_uid, wiki_uid)
        if not wiki or not project:
            return False

        await self._db.delete(wiki)
        await self._db.commit()

        return True

    async def __get_with_project(
        self, project_uid: str, wiki_uid: str
    ) -> tuple[ProjectWiki, Project] | tuple[None, None]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(ProjectWiki, Project)
            .join(Project, ProjectWiki.column("project_id") == Project.id)
            .where((Project.column("uid") == project_uid) & (ProjectWiki.column("uid") == wiki_uid))
        )
        return result.first() or (None, None)
