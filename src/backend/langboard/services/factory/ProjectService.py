from typing import Any, Literal, TypeVar, cast, overload
from ...core.ai import Bot
from ...core.db import BaseSqlModel, SnowflakeID, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...core.utils.DateTime import now
from ...models import Project, ProjectAssignedBot, ProjectAssignedUser, ProjectRole, UserEmail
from ...models.BaseRoleModel import ALL_GRANTED
from .ProjectColumnService import ProjectColumnService
from .ProjectInvitationService import ProjectInvitationService
from .ProjectLabelService import ProjectLabelService
from .RevertService import RevertService, RevertType
from .RoleService import RoleService
from .Types import TProjectParam, TUserOrBot


_TBaseModel1 = TypeVar("_TBaseModel1", bound=BaseSqlModel)
_TBaseModel2 = TypeVar("_TBaseModel2", bound=BaseSqlModel)


class ProjectService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project"

    async def get_by_uid(self, uid: str) -> Project | None:
        return await self._get_by_param(Project, uid)

    async def get_user_role_actions(self, user: User, project: Project) -> list[str]:
        if user.is_admin:
            return [ALL_GRANTED]
        role_service = self._get_service(RoleService)
        roles = await role_service.project.get_roles(user_id=user.id, project_id=project.id)
        return roles[0].actions if roles else []

    @overload
    async def get_assigned_bots(
        self, project: TProjectParam, as_api: Literal[False]
    ) -> list[tuple[Bot, ProjectAssignedBot]]: ...
    @overload
    async def get_assigned_bots(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_bots(
        self, project: TProjectParam, as_api: bool
    ) -> list[tuple[Bot, ProjectAssignedBot]] | list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .tables(Bot, ProjectAssignedBot)
            .join(ProjectAssignedBot, Bot.column("id") == ProjectAssignedBot.bot_id)
            .where(ProjectAssignedBot.project_id == project.id)
        )
        raw_bots = result.all()
        if not as_api:
            return list(raw_bots)

        bots = [bot.api_response() for bot, _ in raw_bots]
        return bots

    @overload
    async def get_assigned_users(
        self, project: TProjectParam, as_api: Literal[False], where_user_ids_in: list[SnowflakeID] | None = None
    ) -> list[tuple[User, ProjectAssignedUser]]: ...
    @overload
    async def get_assigned_users(
        self, project: TProjectParam, as_api: Literal[True], where_user_ids_in: list[SnowflakeID] | None = None
    ) -> list[dict[str, Any]]: ...
    async def get_assigned_users(
        self, project: TProjectParam, as_api: bool, where_user_ids_in: list[SnowflakeID] | None = None
    ) -> list[tuple[User, ProjectAssignedUser]] | list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        query = (
            self._db.query("select")
            .tables(User, ProjectAssignedUser)
            .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.user_id)
            .where(ProjectAssignedUser.project_id == project.id)
        )

        if where_user_ids_in is not None:
            query = query.where(User.column("id").in_(where_user_ids_in))

        result = await self._db.exec(
            self._db.query("select")
            .tables(User, ProjectAssignedUser)
            .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.user_id)
            .where(ProjectAssignedUser.project_id == project.id)
        )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def get_dashboard_list(self, user: User) -> list[dict[str, Any]]:
        sql_query = (
            self._db.query("select")
            .tables(Project, ProjectAssignedUser)
            .join(ProjectAssignedUser, Project.column("id") == ProjectAssignedUser.column("project_id"))
            .outerjoin(ProjectRole, Project.column("id") == ProjectRole.column("project_id"))
            .where(ProjectAssignedUser.column("user_id") == user.id)
        )

        sql_query = sql_query.order_by(Project.column("updated_at").desc(), Project.column("id").desc())
        sql_query = sql_query.group_by(
            Project.column("id"), ProjectAssignedUser.column("id"), ProjectAssignedUser.column("updated_at")
        )

        result = await self._db.exec(sql_query)
        raw_projects = result.all()

        column_service = self._get_service(ProjectColumnService)

        projects = []
        for project, assigned_user in raw_projects:
            columns = await column_service.get_list(project)
            project_dict = project.api_response()
            project_dict["starred"] = assigned_user.starred
            project_dict["last_viewed_at"] = assigned_user.last_viewed_at
            project_dict["columns"] = [
                {
                    **column,
                    "count": await column_service.count_cards(project.id, column["uid"]),
                }
                for column in columns
            ]
            projects.append(project_dict)

        return projects

    async def get_details(self, user: User, project: TProjectParam) -> tuple[Project, dict[str, Any]] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        response = project.api_response()
        owner = cast(User, await self._get_by_param(User, project.owner_id, with_deleted=True))
        response["owner"] = owner.api_response()
        response["members"] = await self.get_assigned_users(project, as_api=True)
        response["bots"] = await self.get_assigned_bots(project, as_api=True)
        response["current_user_role_actions"] = await self.get_user_role_actions(user, project)
        response["labels"] = await self._get_service(ProjectLabelService).get_all(project, as_api=True)

        invitation_service = self._get_service(ProjectInvitationService)
        response["invited_members"] = []
        invited_users = await invitation_service.get_invited_users(project)
        for invitation, invited_user in invited_users:
            if invited_user:
                response["invited_members"].append(invited_user.api_response())
            else:
                response["invited_members"].append(User.create_email_user_api_response(invitation.id, invitation.email))

        return project, response

    async def is_assigned(self, user: User, project: TProjectParam) -> bool:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return False

        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectAssignedUser)
            .where(
                (ProjectAssignedUser.column("project_id") == project.id)
                & (ProjectAssignedUser.column("user_id") == user.id)
            )
            .limit(1)
        )
        return bool(result.first())

    async def toggle_star(self, user: User, uid: str, commit: bool = True) -> bool:
        result = await self._db.exec(
            self._db.query("select")
            .columns(ProjectAssignedUser.starred, Project.id)
            .join(ProjectAssignedUser, Project.column("id") == ProjectAssignedUser.project_id)
            .where(
                (Project.column("id") == SnowflakeID.from_short_code(uid))
                & (ProjectAssignedUser.column("user_id") == user.id)
            )
            .limit(1)
        )
        starred, project_id = result.first() or (None, None)

        if project_id is None:
            return False

        result = await self._db.exec(
            self._db.query("update")
            .table(ProjectAssignedUser)
            .values(starred=not starred)
            .where(
                (ProjectAssignedUser.column("project_id") == project_id)
                & (ProjectAssignedUser.column("user_id") == user.id)
            )
        )

        if commit:
            await self._db.commit()

        return result > 0

    async def set_last_view(self, user: User, project: Project) -> None:
        await self._db.exec(
            self._db.query("update")
            .table(ProjectAssignedUser)
            .values(last_viewed_at=now())
            .where(
                (ProjectAssignedUser.column("project_id") == project.id)
                & (ProjectAssignedUser.column("user_id") == user.id)
            )
        )
        await self._db.commit()

    async def create(
        self, user: User, title: str, description: str | None = None, project_type: str = "Other"
    ) -> Project | None:
        if not user.id or not title:
            return None

        project = Project(owner_id=user.id, title=title, description=description, project_type=project_type)
        self._db.insert(project)
        await self._db.commit()

        await self._get_service(ProjectLabelService).init_defaults(project)

        assigned_user = ProjectAssignedUser(project_id=project.id, user_id=user.id)
        self._db.insert(assigned_user)

        role_service = self._get_service(RoleService)
        await role_service.project.grant_all(user_id=user.id, project_id=project.id)
        await self._db.commit()

        return project

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, form: dict
    ) -> tuple[str | None, dict[str, Any]] | Literal[True] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        old_project_record = {}
        mutable_keys = ["title", "description", "project_type", "ai_description"]

        for key in mutable_keys:
            if key not in form or not hasattr(project, key):
                continue
            old_value = getattr(project, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_project_record[key] = self._convert_to_python(old_value)
            setattr(project, key, new_value)

        if not old_project_record:
            return True

        if isinstance(user_or_bot, Bot):
            await self._db.update(project)
            await self._db.commit()
            revert_key = None
        else:
            revert_service = self._get_service(RevertService)
            revert_key = await revert_service.record(revert_service.create_record_model(project, RevertType.Update))

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_project_record:
                continue
            model[key] = self._convert_to_python(getattr(project, key))

        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:details:changed:{topic_id}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

        return revert_key, model

    async def update_assigned_bots(
        self, user_or_bot: TUserOrBot, project: TProjectParam, assign_bot_uids: list[str]
    ) -> list[Bot] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        # old_assigned_bots = await self.get_assigned_bots(project, as_api=False)

        await self._db.exec(
            self._db.query("delete")
            .table(ProjectAssignedBot)
            .where(ProjectAssignedBot.column("project_id") == project.id)
        )

        if assign_bot_uids:
            assigned_bot_ids = [SnowflakeID.from_short_code(uid) for uid in assign_bot_uids]
            bots = await self._get_all_by(Bot, "id", assigned_bot_ids)
            for bot in bots:
                self._db.insert(ProjectAssignedBot(project_id=project.id, bot_id=bot.id))
        else:
            bots = []
        await self._db.commit()

        model = {"assigned_bots": [bot.api_response() for bot in bots]}
        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:assigned-bots:updated:{topic_id}",
                data_keys="assigned_bots",
            ),
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=topic_id,
                event=f"board:assigned-bots:updated:{topic_id}",
                data_keys="assigned_bots",
            ),
            SocketPublishModel(
                topic=SocketTopic.BoardWiki,
                topic_id=topic_id,
                event=f"board:assigned-bots:updated:{topic_id}",
                data_keys="assigned_bots",
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)

        return list(bots)

    async def update_assigned_users(
        self, user: User, project: TProjectParam, lang: str, url: str, token_query_name: str, emails: list[str]
    ) -> dict[str, str] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        result = await self._db.exec(
            self._db.query("select")
            .tables(User, UserEmail, ProjectAssignedUser)
            .outerjoin(
                UserEmail,
                (User.column("id") == UserEmail.column("user_id")) & (UserEmail.column("deleted_at") == None),  # noqa
            )
            .outerjoin(ProjectAssignedUser, (User.column("id") == ProjectAssignedUser.column("user_id")))
            .where(
                (User.column("email").in_(emails) | UserEmail.column("email").in_(emails))
                | (ProjectAssignedUser.column("project_id") == project.id)
            )
        )
        records = result.all()

        updated_assigned_users: list[User] = []
        assigned_user_ids = []
        inviting_emails: list[str] = [*emails]
        for target_user, target_subemail, assigned_user in records:
            if not assigned_user or target_user.id in assigned_user_ids:
                continue

            updated_assigned_users.append(target_user)
            assigned_user_ids.append(assigned_user.id)
            if target_subemail.email in inviting_emails:
                inviting_emails.remove(target_subemail.email)
            if target_user.email in inviting_emails:
                inviting_emails.remove(target_user.email)

        removed_assigned_user_ids: list[SnowflakeID] = []
        removed_assigned_users: list[ProjectAssignedUser] = []
        prev_assigned_users = await self._get_all_by(ProjectAssignedUser, "project_id", project.id)
        for prev_assigned_user in prev_assigned_users:
            if project.owner_id == prev_assigned_user.user_id or prev_assigned_user.id in assigned_user_ids:
                continue

            removed_assigned_user_ids.append(prev_assigned_user.id)
            removed_assigned_users.append(prev_assigned_user)

        for removed_assigned_user in removed_assigned_users:
            await self._db.delete(removed_assigned_user)

        await self._db.commit()

        project_invitation_service = self._get_service(ProjectInvitationService)
        _, invited_users, urls = await project_invitation_service.invite_emails(
            user, project, lang, url, token_query_name, inviting_emails
        )

        model = {
            "assigned_members": [assigned_user.api_response() for assigned_user in updated_assigned_users],
            "invited_members": invited_users,
        }

        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:assigned-users:updated:{topic_id}",
                data_keys=["assigned_members", "invited_members"],
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:assigned-users:updated:{topic_id}",
                data_keys="assigned_members",
            ),
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=topic_id,
                event=f"board:assigned-users:updated:{topic_id}",
                data_keys="assigned_members",
            ),
            SocketPublishModel(
                topic=SocketTopic.BoardWiki,
                topic_id=topic_id,
                event=f"board:assigned-users:updated:{topic_id}",
                data_keys="assigned_members",
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)

        return urls
