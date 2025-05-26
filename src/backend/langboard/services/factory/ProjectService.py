from typing import Any, Literal, cast, overload
from sqlalchemy.orm import aliased
from sqlalchemy.orm.attributes import InstrumentedAttribute
from ...core.ai import Bot
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService, ServiceHelper
from ...core.utils.Converter import convert_python_data
from ...core.utils.DateTime import now
from ...models import Card, Checkitem, Checklist, Project, ProjectAssignedBot, ProjectAssignedUser, ProjectRole
from ...models.BaseRoleModel import ALL_GRANTED
from ...models.Checkitem import CheckitemStatus
from ...models.ProjectRole import ProjectRoleAction
from ...publishers import ProjectPublisher
from ...tasks.activities import ProjectActivityTask
from ...tasks.bot import BotDefaultTask, ProjectBotTask
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
        return ServiceHelper.get_by_param(Project, uid)

    async def get_role_actions(self, user_or_bot: TUserOrBot, project: Project) -> list[str]:
        if isinstance(user_or_bot, User) and user_or_bot.is_admin:
            return [ALL_GRANTED]
        role_service = self._get_service(RoleService)
        if isinstance(user_or_bot, Bot):
            role = await role_service.project.get_role(bot_id=user_or_bot.id, project_id=project.id)
        else:
            role = await role_service.project.get_role(user_id=user_or_bot.id, project_id=project.id)
        return role.actions if role else []

    async def get_all_role_actions(self, user_or_bot: TUserOrBot) -> list[ProjectRole]:
        role_service = self._get_service(RoleService)
        if isinstance(user_or_bot, Bot):
            roles = await role_service.project.get_roles(bot_id=user_or_bot.id)
        else:
            roles = await role_service.project.get_roles(user_id=user_or_bot.id)
        return roles

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
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []
        query = (
            SqlBuilder.select.tables(Bot, ProjectAssignedBot)
            .join(ProjectAssignedBot, Bot.column("id") == ProjectAssignedBot.bot_id)
            .where(ProjectAssignedBot.project_id == project.id)
        )

        if where_bot_ids_in is not None:
            query = query.where(Bot.column("id").in_(where_bot_ids_in))

        raw_bots = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            raw_bots = result.all()
        if not as_api:
            return raw_bots

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
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []
        query = (
            SqlBuilder.select.tables(User, ProjectAssignedUser)
            .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.column("user_id"))
            .where(ProjectAssignedUser.column("project_id") == project.id)
        )

        if where_user_ids_in is not None:
            query = query.where(User.column("id").in_(where_user_ids_in))

        raw_users = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            raw_users = result.all()
        if not as_api:
            return raw_users

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def get_dashboard_list(self, user: User) -> list[dict[str, Any]]:
        sql_query = (
            SqlBuilder.select.tables(Project, ProjectAssignedUser)
            .join(ProjectAssignedUser, Project.column("id") == ProjectAssignedUser.column("project_id"))
            .where(ProjectAssignedUser.column("user_id") == user.id)
            .order_by(Project.column("updated_at").desc(), Project.column("id").desc())
        )

        raw_projects = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            raw_projects = result.all()

        column_service = self._get_service(ProjectColumnService)

        projects = []
        all_roles = await self.get_all_role_actions(user)
        roles_dict = {}

        if not user.is_admin:
            for role in all_roles:
                if role.project_id in roles_dict:
                    continue
                roles_dict[role.project_id] = role.actions

        for project, assigned_user in raw_projects:
            if not user.is_admin and project.id not in roles_dict:
                continue

            project_dict = project.api_response()
            project_dict["starred"] = assigned_user.starred
            project_dict["last_viewed_at"] = assigned_user.last_viewed_at
            project_dict["current_auth_role_actions"] = roles_dict[project.id] if not user.is_admin else [ALL_GRANTED]
            project_dict["columns"] = await column_service.get_all_by_project(project, as_api=True, with_count=True)
            projects.append(project_dict)

        return projects

    async def get_starred_projects(self, user: User) -> list[dict[str, str]]:
        if not user or user.is_new():
            return []

        raw_projects = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(Project)
                .join(ProjectAssignedUser, ProjectAssignedUser.column("project_id") == Project.column("id"))
                .where(ProjectAssignedUser.column("user_id") == user.id)
                .where(ProjectAssignedUser.column("starred") == True)  # noqa
                .order_by(
                    ProjectAssignedUser.column("last_viewed_at").desc(),
                    Project.column("updated_at").desc(),
                    Project.column("id").desc(),
                )
                .group_by(
                    Project.column("id"),
                    ProjectAssignedUser.column("id"),
                    Project.column("updated_at"),
                    ProjectAssignedUser.column("last_viewed_at"),
                )
            )
            raw_projects = result.all()
        projects = []
        for project in raw_projects:
            api_project = project.api_response()
            api_project["current_auth_role_actions"] = await self.get_role_actions(user, project)
            projects.append(api_project)

        return projects

    async def get_details(
        self, user_or_bot: TUserOrBot, project: TProjectParam, is_setting: bool
    ) -> tuple[Project, dict[str, Any]] | None:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return None

        response = project.api_response()
        owner = ServiceHelper.get_by_param(User, project.owner_id, with_deleted=True)
        if not owner:
            return None

        response["owner"] = owner.api_response()
        response["members"] = await self.get_assigned_users(project, as_api=True)
        response["bots"] = await self.get_assigned_bots(project, as_api=True)
        response["current_auth_role_actions"] = await self.get_role_actions(user_or_bot, project)
        response["labels"] = await self._get_service(ProjectLabelService).get_all(project, as_api=True)
        if is_setting:
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

    async def is_assigned(
        self, user_or_bot: TUserOrBot, project: TProjectParam
    ) -> tuple[bool, ProjectAssignedBot | ProjectAssignedUser | None]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return False, None

        target_table = ProjectAssignedBot if isinstance(user_or_bot, Bot) else ProjectAssignedUser
        target_column = "bot_id" if isinstance(user_or_bot, Bot) else "user_id"
        assignee = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(target_table)
                .where(
                    (target_table.column("project_id") == project.id)
                    & (target_table.column(target_column) == user_or_bot.id)
                )
                .limit(1)
            )
            assignee = result.first()
        return bool(assignee), assignee

    async def is_user_related_to_other_user(self, user: User, target_user: User) -> bool:
        user_a = aliased(ProjectAssignedUser)
        user_b = aliased(ProjectAssignedUser)

        record = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.column(user_a.id)
                .join(user_b, cast(InstrumentedAttribute, user_a.project_id) == user_b.project_id)
                .where((user_a.user_id == user.id) & (user_b.user_id == target_user.id))
            )
            record = result.first()
        return bool(record)

    async def toggle_star(self, user: User, uid: str) -> bool:
        starred, project_id = None, None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.columns(ProjectAssignedUser.starred, Project.id)
                .join(ProjectAssignedUser, Project.column("id") == ProjectAssignedUser.column("project_id"))
                .where(
                    (Project.column("id") == SnowflakeID.from_short_code(uid))
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
                .limit(1)
            )
            starred, project_id = result.first() or (None, None)

        if project_id is None:
            return False

        with DbSession.use(readonly=False) as db:
            result = db.exec(
                SqlBuilder.update.table(ProjectAssignedUser)
                .values(starred=not starred)
                .where(
                    (ProjectAssignedUser.column("project_id") == project_id)
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
            )

        return result > 0

    async def set_last_view(self, user: User, project: Project) -> None:
        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(ProjectAssignedUser)
                .values(last_viewed_at=now())
                .where(
                    (ProjectAssignedUser.column("project_id") == project.id)
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
            )

    async def create(
        self, user: User, title: str, description: str | None = None, project_type: str = "Other"
    ) -> Project:
        project = Project(owner_id=user.id, title=title, description=description, project_type=project_type)
        with DbSession.use(readonly=False) as db:
            db.insert(project)

        column_service = self._get_service(ProjectColumnService)
        await column_service.get_or_create_archive_if_not_exists(project)

        await self._get_service(ProjectLabelService).init_defaults(project)

        assigned_user = ProjectAssignedUser(project_id=project.id, user_id=user.id)
        with DbSession.use(readonly=False) as db:
            db.insert(assigned_user)

        role_service = self._get_service(RoleService)
        await role_service.project.grant_all(user_id=user.id, project_id=project.id)

        ProjectActivityTask.project_created(user, project)

        return project

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
        project = ServiceHelper.get_by_param(Project, project)
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
            old_project_record[key] = convert_python_data(old_value)
            setattr(project, key, new_value)

        if not old_project_record:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(project)

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_project_record:
                continue
            model[key] = convert_python_data(getattr(project, key))

        ProjectPublisher.updated(project, model)
        ProjectActivityTask.project_updated(user_or_bot, old_project_record, project)
        ProjectBotTask.project_updated(user_or_bot, project)

        return model

    async def update_assigned_bots(
        self, user: User, project: TProjectParam, assign_bots: list[str] | list[SnowflakeID]
    ) -> list[Bot] | None:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return None

        assigned_bot_ids = [SnowflakeID.from_short_code(uid) if isinstance(uid, str) else uid for uid in assign_bots]
        old_assigned_bots = await self.get_assigned_bots(project, as_api=False)
        old_assigned_bot_ids: list[int] = [bot.id for bot, _ in old_assigned_bots]

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(ProjectRole).where(
                    (ProjectRole.column("project_id") == project.id)
                    & (ProjectRole.column("bot_id").not_in(assigned_bot_ids))
                    & (ProjectRole.column("bot_id") != None)  # noqa
                )
            )

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(ProjectAssignedBot).where(
                    (ProjectAssignedBot.column("project_id") == project.id)
                    & (ProjectAssignedBot.column("bot_id").not_in(assigned_bot_ids))
                )
            )

        role_service = self._get_service(RoleService)

        bots = []
        if assign_bots:
            bots = ServiceHelper.get_all_by(Bot, "id", assigned_bot_ids)
            for bot in bots:
                if bot.id in old_assigned_bot_ids:
                    continue

                with DbSession.use(readonly=False) as db:
                    db.insert(ProjectAssignedBot(project_id=project.id, bot_id=bot.id))
                await role_service.project.grant_default(bot_id=bot.id, project_id=project.id)

        new_bot_ids: list[int] = [bot.id for bot in bots]

        ProjectPublisher.assigned_bots_updated(project, bots)
        ProjectActivityTask.project_assigned_bots_updated(user, project, old_assigned_bot_ids, new_bot_ids)
        BotDefaultTask.bot_project_assigned(user, project, old_assigned_bot_ids, new_bot_ids)

        return bots

    async def update_assigned_users(self, user: User, project: TProjectParam, emails: list[str]) -> bool:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return False

        old_assigned_users = await self.get_assigned_users(project, as_api=False)

        invitation_service = self._get_service(ProjectInvitationService)
        invitation_related_data = await invitation_service.get_invitation_related_data(project, emails)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(ProjectRole).where(
                    (ProjectRole.column("project_id") == project.id)
                    & (ProjectRole.column("user_id").in_(invitation_related_data.user_ids_should_delete))
                    & (ProjectRole.column("user_id") != user.id)
                    & (ProjectRole.column("user_id") != None)  # noqa
                )
            )

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(ProjectAssignedUser).where(
                    (ProjectAssignedUser.column("project_id") == project.id)
                    & ProjectAssignedUser.column("id").in_(invitation_related_data.assigned_ids_should_delete)
                    & (ProjectAssignedUser.column("user_id") != user.id)
                )
            )

        result = await invitation_service.invite_emails(user, project, invitation_related_data)

        new_assigned_users = await self.get_assigned_users(project, as_api=False)
        model = {
            "assigned_members": [user.api_response() for user, _ in new_assigned_users],
            "invited_members": await invitation_service.get_invited_users(project, as_api=True),
        }

        ProjectPublisher.assigned_users_updated(project, model)
        ProjectActivityTask.project_assigned_users_updated(
            user, project, [user.id for user, _ in old_assigned_users], [user.id for user, _ in new_assigned_users]
        )

        return result

    async def unassign_assignee(self, user: User, project: TProjectParam, target: TUserParam | TBotParam) -> bool:
        project = ServiceHelper.get_by_param(Project, project)
        target_user = ServiceHelper.get_by_param(User, target)
        if not target_user:
            target_bot = ServiceHelper.get_by_param(Bot, target)
            if not target_bot:
                return False
            target = target_bot
        else:
            target = target_user

        if not project or not (await self.is_assigned(target, project))[0] or project.owner_id == target.id:
            return False

        if isinstance(target, Bot):
            bots = await self.get_assigned_bots(project, as_api=False)
            new_bot_ids = [bot.id for bot, _ in bots if bot.id != target.id]
            await self.update_assigned_bots(user, project, new_bot_ids)
            return True

        users = await self.get_assigned_users(project, as_api=False)
        invitation_service = self._get_service(ProjectInvitationService)
        invitations = await invitation_service.get_invited_users(project, as_api=False)
        new_user_emails = [
            *[user.email for user, _ in users if user.id != target.id],
            *[invitation.email for invitation, user in invitations if not user or user.id != target.id],
        ]

        return await self.update_assigned_users(user, project, new_user_emails)

    async def update_bot_roles(self, project: TProjectParam, target_bot: TBotParam, roles: list[ProjectRoleAction]):
        project = ServiceHelper.get_by_param(Project, project)
        target_bot = ServiceHelper.get_by_param(Bot, target_bot)
        if not project or not target_bot:
            return False

        is_assigned, assigned_bot = await self.is_assigned(target_bot, project)
        if not is_assigned or not assigned_bot or cast(ProjectAssignedBot, assigned_bot).is_disabled:
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
        project = ServiceHelper.get_by_param(Project, project)
        target_user = ServiceHelper.get_by_param(User, target_user)
        if not project or not target_user or not (await self.is_assigned(target_user, project))[0]:
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

    async def toggle_bot_activation(self, user: User, project: TProjectParam, target_bot: TBotParam) -> bool:
        project = ServiceHelper.get_by_param(Project, project)
        target_bot = ServiceHelper.get_by_param(Bot, target_bot)
        if not project or not target_bot:
            return False

        is_assigned, assigned_bot = await self.is_assigned(target_bot, project)
        if not is_assigned or not assigned_bot:
            return False

        assigned_bot = cast(ProjectAssignedBot, assigned_bot)

        is_disabled = not assigned_bot.is_disabled

        with DbSession.use(readonly=False) as db:
            assigned_bot.is_disabled = is_disabled
            db.update(assigned_bot)

        ProjectPublisher.bot_activation_toggled(project, target_bot, is_disabled)
        ProjectActivityTask.project_bot_activation_toggled(user, project, target_bot, is_disabled)

        return True

    async def delete(self, user: User, project: TProjectParam) -> bool:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return False

        started_checkitems = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
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

        with DbSession.use(readonly=False) as db:
            db.delete(project)

        ProjectPublisher.deleted(project)
        ProjectActivityTask.project_deleted(user, project)
        ProjectBotTask.project_deleted(user, project)

        return True
