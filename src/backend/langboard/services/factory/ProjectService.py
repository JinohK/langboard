from typing import Any, Literal, cast, overload
from sqlalchemy.orm import aliased
from sqlalchemy.orm.attributes import InstrumentedAttribute
from ...core.ai import Bot
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService
from ...core.utils.DateTime import now
from ...models import Card, Checkitem, Checklist, Project, ProjectAssignedBot, ProjectAssignedUser, ProjectRole
from ...models.BaseRoleModel import ALL_GRANTED
from ...models.Checkitem import CheckitemStatus
from ...models.ProjectRole import ProjectRoleAction
from ...publishers import ProjectPublisher
from ...tasks.activities import ProjectActivityTask
from .ProjectColumnService import ProjectColumnService
from .ProjectInvitationService import ProjectInvitationService
from .ProjectLabelService import ProjectLabelService
from .RoleService import RoleService
from .Types import TBotParam, TProjectParam, TUserOrBot, TUserParam


class ProjectService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project"

    async def get_by_uid(self, uid: str) -> Project | None:
        return await self._get_by_param(Project, uid)

    async def get_role_actions(self, user_or_bot: TUserOrBot, project: Project) -> list[str]:
        if isinstance(user_or_bot, User) and user_or_bot.is_admin:
            return [ALL_GRANTED]
        role_service = self._get_service(RoleService)
        if isinstance(user_or_bot, Bot):
            roles = await role_service.project.get_roles(bot_id=user_or_bot.id, project_id=project.id)
        else:
            roles = await role_service.project.get_roles(user_id=user_or_bot.id, project_id=project.id)
        return roles[0].actions if roles else []

    @overload
    async def get_assigned_bots(
        self, project: TProjectParam, as_api: Literal[False], where_bot_ids_in: list[SnowflakeID] | None = None
    ) -> list[tuple[Bot, ProjectAssignedBot]]: ...
    @overload
    async def get_assigned_bots(
        self, project: TProjectParam, as_api: Literal[True], where_bot_ids_in: list[SnowflakeID] | None = None
    ) -> list[dict[str, Any]]: ...
    async def get_assigned_bots(
        self, project: TProjectParam, as_api: bool, where_bot_ids_in: list[SnowflakeID] | None = None
    ) -> list[tuple[Bot, ProjectAssignedBot]] | list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        query = (
            SqlBuilder.select.tables(Bot, ProjectAssignedBot)
            .join(ProjectAssignedBot, Bot.column("id") == ProjectAssignedBot.bot_id)
            .where(ProjectAssignedBot.project_id == project.id)
        )

        if where_bot_ids_in is not None:
            query = query.where(Bot.column("id").in_(where_bot_ids_in))

        async with DbSession.use() as db:
            result = await db.exec(query)
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
            SqlBuilder.select.tables(User, ProjectAssignedUser)
            .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.user_id)
            .where(ProjectAssignedUser.project_id == project.id)
        )

        if where_user_ids_in is not None:
            query = query.where(User.column("id").in_(where_user_ids_in))

        async with DbSession.use() as db:
            result = await db.exec(query)
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def get_dashboard_list(self, user: User) -> list[dict[str, Any]]:
        sql_query = (
            SqlBuilder.select.tables(Project, ProjectAssignedUser)
            .join(ProjectAssignedUser, Project.column("id") == ProjectAssignedUser.column("project_id"))
            .outerjoin(ProjectRole, Project.column("id") == ProjectRole.column("project_id"))
            .where(ProjectAssignedUser.column("user_id") == user.id)
        )

        sql_query = sql_query.order_by(Project.column("updated_at").desc(), Project.column("id").desc())
        sql_query = sql_query.group_by(
            Project.column("id"), ProjectAssignedUser.column("id"), ProjectAssignedUser.column("updated_at")
        )

        async with DbSession.use() as db:
            result = await db.exec(sql_query)
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

    async def get_details(
        self, user_or_bot: TUserOrBot, project: TProjectParam, with_roles: bool
    ) -> tuple[Project, dict[str, Any]] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        response = project.api_response()
        owner = cast(User, await self._get_by_param(User, project.owner_id, with_deleted=True))
        response["owner"] = owner.api_response()
        response["members"] = await self.get_assigned_users(project, as_api=True)
        response["bots"] = await self.get_assigned_bots(project, as_api=True)
        response["current_auth_role_actions"] = await self.get_role_actions(user_or_bot, project)
        response["labels"] = await self._get_service(ProjectLabelService).get_all(project, as_api=True)
        if with_roles:
            role_service = self._get_service(RoleService)
            roles = await role_service.project.get_roles(project_id=project.id)
            response["bot_roles"] = {}
            response["member_roles"] = {}
            for role in roles:
                if role.bot_id:
                    response["bot_roles"][role.bot_id.to_short_code()] = role.actions
                elif role.user_id and role.user_id != project.owner_id:
                    response["member_roles"][role.user_id.to_short_code()] = role.actions

        invitation_service = self._get_service(ProjectInvitationService)
        response["invited_members"] = await invitation_service.get_invited_users(project, as_api=True)

        return project, response

    async def is_assigned(self, user_or_bot: TUserOrBot, project: TProjectParam) -> bool:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return False

        target_column = "bot_id" if isinstance(user_or_bot, Bot) else "user_id"
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectAssignedUser)
                .where(
                    (ProjectAssignedUser.column("project_id") == project.id)
                    & (ProjectAssignedUser.column(target_column) == user_or_bot.id)
                )
                .limit(1)
            )
        return bool(result.first())

    async def is_user_related_to_other_user(self, user: User, target_user: User) -> bool:
        user_a = aliased(ProjectAssignedUser)
        user_b = aliased(ProjectAssignedUser)

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.column(user_a.id)
                .join(user_b, cast(InstrumentedAttribute, user_a.project_id) == user_b.project_id)
                .where((user_a.user_id == 1) & (user_b.user_id == 2))
            )

        return bool(result.first())

    async def toggle_star(self, user: User, uid: str) -> bool:
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.columns(ProjectAssignedUser.starred, Project.id)
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

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.update.table(ProjectAssignedUser)
                .values(starred=not starred)
                .where(
                    (ProjectAssignedUser.column("project_id") == project_id)
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
            )
            await db.commit()

        return result > 0

    async def set_last_view(self, user: User, project: Project) -> None:
        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.update.table(ProjectAssignedUser)
                .values(last_viewed_at=now())
                .where(
                    (ProjectAssignedUser.column("project_id") == project.id)
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
            )
            await db.commit()

    async def create(
        self, user: User, title: str, description: str | None = None, project_type: str = "Other"
    ) -> Project | None:
        if not title:
            return None

        project = Project(owner_id=user.id, title=title, description=description, project_type=project_type)
        async with DbSession.use() as db:
            db.insert(project)
            await db.commit()

        column_service = self._get_service(ProjectColumnService)
        await column_service.get_or_create_archive_if_not_exists(project)

        await self._get_service(ProjectLabelService).init_defaults(project)

        assigned_user = ProjectAssignedUser(project_id=project.id, user_id=user.id)
        async with DbSession.use() as db:
            db.insert(assigned_user)
            await db.commit()

        role_service = self._get_service(RoleService)
        await role_service.project.grant_all(user_id=user.id, project_id=project.id)

        ProjectActivityTask.project_created(user, project)

        return project

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
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

        async with DbSession.use() as db:
            await db.update(project)
            await db.commit()

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_project_record:
                continue
            model[key] = self._convert_to_python(getattr(project, key))

        ProjectPublisher.updated(project, model)

        ProjectActivityTask.project_updated(user_or_bot, old_project_record, project)

        return model

    async def update_assigned_bots(
        self, user: User, project: TProjectParam, assign_bot_uids: list[str]
    ) -> list[Bot] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        assigned_bot_ids = [SnowflakeID.from_short_code(uid) for uid in assign_bot_uids]
        old_assigned_bots = await self.get_assigned_bots(project, as_api=False)
        old_assigned_bot_ids: list[int] = [bot.id for bot, _ in old_assigned_bots]

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(ProjectRole).where(
                    (ProjectRole.column("project_id") == project.id)
                    & (ProjectRole.column("bot_id").not_in(assigned_bot_ids))
                    & (ProjectRole.column("bot_id") != None)  # noqa
                )
            )
            await db.commit()

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(ProjectAssignedBot).where(
                    (ProjectAssignedBot.column("project_id") == project.id)
                    & (ProjectAssignedBot.column("bot_id").not_in(assigned_bot_ids))
                )
            )
            await db.commit()

        role_service = self._get_service(RoleService)

        bots = []
        if assign_bot_uids:
            bots = await self._get_all_by(Bot, "id", assigned_bot_ids)
            for bot in bots:
                if bot.id in old_assigned_bot_ids:
                    continue

                async with DbSession.use() as db:
                    db.insert(ProjectAssignedBot(project_id=project.id, bot_id=bot.id))
                    await db.commit()
                await role_service.project.grant_default(bot_id=bot.id, project_id=project.id)

        ProjectPublisher.assigned_bots_updated(project, bots)

        ProjectActivityTask.project_assigned_bots_updated(user, project, old_assigned_bot_ids, [bot.id for bot in bots])

        return list(bots)

    async def update_assigned_users(
        self, user: User, project: TProjectParam, emails: list[str]
    ) -> dict[str, str] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        old_assigned_users = await self.get_assigned_users(project, as_api=False)

        invitation_service = self._get_service(ProjectInvitationService)
        invitation_related_data = await invitation_service.get_invitation_related_data(project, emails)

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(ProjectRole).where(
                    (ProjectRole.column("project_id") == project.id)
                    & (ProjectRole.column("user_id").in_(invitation_related_data.user_ids_should_delete))
                    & (ProjectRole.column("user_id") != None)  # noqa
                )
            )
            await db.commit()

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(ProjectAssignedUser).where(
                    ProjectAssignedUser.column("id").in_(invitation_related_data.assigned_ids_should_delete)
                )
            )
            await db.commit()

        _, urls = await invitation_service.invite_emails(user, project, invitation_related_data)

        new_assigned_users = await self.get_assigned_users(project, as_api=False)
        model = {
            "assigned_members": [user.api_response() for user, _ in new_assigned_users],
            "invited_members": await invitation_service.get_invited_users(project, as_api=True),
        }

        ProjectPublisher.assigned_users_updated(project, model)

        ProjectActivityTask.project_assigned_users_updated(
            user, project, [user.id for user, _ in old_assigned_users], [user.id for user, _ in new_assigned_users]
        )

        return urls

    async def update_bot_roles(self, project: TProjectParam, target_bot: TBotParam, roles: list[ProjectRoleAction]):
        project = cast(Project, await self._get_by_param(Project, project))
        target_bot = cast(Bot, await self._get_by_param(Bot, target_bot))
        if not project or not target_bot or not await self.is_assigned(target_bot, project):
            return False

        if ProjectRoleAction.Read not in roles:
            roles.append(ProjectRoleAction.Read)

        role_strs = [role.value for role in roles]
        role_service = self._get_service(RoleService)
        if roles == list(ProjectRoleAction._member_map_.values()):
            await role_service.project.grant_all(bot_id=target_bot.id, project_id=project.id)
        elif not roles:
            await role_service.project.grant_default(bot_id=target_bot.id, project_id=project.id)
        else:
            await role_service.project.grant(actions=role_strs, bot_id=target_bot.id, project_id=project.id)

        ProjectPublisher.bot_roles_updated(project, target_bot, role_strs)

        return True

    async def update_user_roles(self, project: TProjectParam, target_user: TUserParam, roles: list[ProjectRoleAction]):
        project = cast(Project, await self._get_by_param(Project, project))
        target_user = cast(User, await self._get_by_param(User, target_user))
        if not project or not target_user or not await self.is_assigned(target_user, project):
            return False

        if project.owner_id == target_user.id:
            return True

        if ProjectRoleAction.Read not in roles:
            roles.append(ProjectRoleAction.Read)

        role_strs = [role.value for role in roles]
        role_service = self._get_service(RoleService)
        if roles == list(ProjectRoleAction._member_map_.values()):
            await role_service.project.grant_all(user_id=target_user.id, project_id=project.id)
        elif not roles:
            await role_service.project.grant_default(user_id=target_user.id, project_id=project.id)
        else:
            await role_service.project.grant(actions=role_strs, user_id=target_user.id, project_id=project.id)

        ProjectPublisher.user_roles_updated(project, target_user, role_strs)

        return True

    async def delete(self, user: User, project: TProjectParam) -> bool:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return False

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.tables(Checkitem, Card)
                .join(Checklist, Checkitem.column("checklist_id") == Checklist.column("id"))
                .join(Card, Checklist.column("card_id") == Card.column("id"))
                .where(
                    (Card.column("project_id") == project.id) & (Checkitem.column("status") == CheckitemStatus.Started)
                )
            )
        started_checkitems = result.all()

        checkitem_service = self._get_service_by_name("checkitem")
        current_time = now()
        for checkitem, card in started_checkitems:
            await checkitem_service.change_status(
                user, project, card, checkitem, CheckitemStatus.Stopped, current_time, should_publish=False
            )

        async with DbSession.use() as db:
            await db.delete(project)
            await db.commit()

        ProjectPublisher.deleted(project)

        ProjectActivityTask.project_deleted(user, project)

        return True
