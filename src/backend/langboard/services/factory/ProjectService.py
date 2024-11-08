from typing import Any, Literal, cast, overload
from sqlalchemy import func
from sqlmodel import asc, desc
from sqlmodel.sql.expression import Select
from ...core.ai import BotType
from ...core.schema import Pagination
from ...core.utils.DateTime import now
from ...models import (
    Group,
    GroupAssignedUser,
    Project,
    ProjectActivity,
    ProjectAssignedUser,
    ProjectColumn,
    ProjectRole,
    User,
)
from ...models.BaseRoleModel import ALL_GRANTED
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService
from .GroupService import GroupService
from .RevertService import RevertService, RevertType
from .RoleService import RoleService
from .UserService import UserService


class ProjectService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project"

    async def get_by_id(self, project_id: int) -> Project | None:
        result = await self._db.exec(self._db.query("select").table(Project).where(Project.id == project_id))
        return result.first()

    async def get_by_uid(self, uid: str) -> Project | None:
        result = await self._db.exec(self._db.query("select").table(Project).where(Project.uid == uid))
        return result.first()

    async def get_columns(self, project: Project) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectColumn)
            .where(ProjectColumn.column("project_id") == project.id)
            .order_by(asc(ProjectColumn.order))
            .group_by(ProjectColumn.column("order"))
        )
        raw_columns = result.all()
        columns = []
        for raw_column in raw_columns:
            columns.append(raw_column.api_response())
        return columns

    async def get_user_role_actions(self, user: User, project: Project) -> list[str]:
        if user.is_admin:
            return [ALL_GRANTED]
        role_service = self._get_service(RoleService)
        roles = await role_service.project.get_roles(user_id=user.id, group_id=None, project_id=cast(int, project.id))
        if roles:
            return roles[0].actions
        role_class = role_service.project._model_class
        result = await self._db.exec(
            self._db.query("select")
            .column(role_class.actions)
            .join(GroupAssignedUser, role_class.column("group_id") == GroupAssignedUser.group_id)
            .where(GroupAssignedUser.user_id == user.id)
        )
        actions = result.first()
        return list(actions or [])

    async def get_assigned_users(self, project: Project) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .table(User)
            .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.user_id)
            .where(ProjectAssignedUser.project_id == project.id)
        )
        raw_users = result.all()
        users = []
        for user in raw_users:
            users.append(user.api_response())

        return users

    async def get_dashboard_list(
        self, user: User, list_type: Literal["all", "starred", "recent", "unstarred"] | str, pagination: Pagination
    ) -> tuple[list[dict[str, Any]], int]:
        if list_type not in ["all", "starred", "recent", "unstarred"]:
            return [], 0

        sql_query = (
            self._db.query("select")
            .columns(
                Project.uid,
                ProjectAssignedUser.starred,
                Project.title,
                Project.project_type,
            )
            .join(
                ProjectAssignedUser,
                Project.id == ProjectAssignedUser.project_id,  # type: ignore
            )
            .where(ProjectAssignedUser.user_id == user.id)
        )

        descs = [desc(Project.updated_at), desc(Project.id)]
        group_bys = [Project.column("id"), ProjectAssignedUser.column("starred")]

        if list_type == "starred":
            sql_query = sql_query.where(ProjectAssignedUser.starred == True)  # noqa
        elif list_type == "recent":
            descs.insert(0, desc(ProjectAssignedUser.last_viewed_at))
            group_bys.append(ProjectAssignedUser.column("last_viewed_at"))
        elif list_type == "unstarred":
            sql_query = sql_query.where(ProjectAssignedUser.starred == False)  # noqa

        result = await self._db.exec(self._db.query("select").count(sql_query, Project.id))
        (total,) = result.one()

        sql_query = sql_query.order_by(*descs)
        sql_query = self.paginate(sql_query, pagination.page, pagination.limit)

        sql_query = cast(
            Select[tuple[str, bool, str, str, str | None]],
            (
                sql_query.add_columns(func.aggregate_strings(Group.column("name"), ","))
                .outerjoin(
                    ProjectRole,
                    Project.id == ProjectRole.project_id,  # type: ignore
                )
                .outerjoin(
                    Group,
                    (ProjectRole.group_id == Group.id) & (Group.deleted_at == None),  # type: ignore # noqa
                )
                .group_by(*group_bys)
            ),
        )

        result = await self._db.exec(sql_query)
        projects = result.all()

        dict_projects = []

        for uid, starred, title, project_type, group_names in projects:
            dict_projects.append(
                {
                    "uid": uid,
                    "starred": starred,
                    "title": title,
                    "project_type": project_type,
                    "group_names": group_names.split(",") if group_names else [],
                }
            )

        return dict_projects, total

    async def toggle_star(self, user: User, uid: str, commit: bool = True) -> bool:
        result = await self._db.exec(
            self._db.query("select")
            .columns(ProjectAssignedUser.starred, Project.id)
            .join(
                ProjectAssignedUser,
                Project.id == ProjectAssignedUser.project_id,  # type: ignore
            )
            .where(Project.uid == uid)
            .where(ProjectAssignedUser.user_id == user.id)
            .limit(1)
        )
        starred, project_id = result.first() or (None, None)

        if project_id is None:
            return False

        result = await self._db.exec(
            self._db.query("update")
            .table(ProjectAssignedUser)
            .values(starred=not starred)
            .where((ProjectAssignedUser.project_id == project_id) & (ProjectAssignedUser.user_id == user.id))
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

    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectCreated)
    async def create(
        self, user: User, title: str, description: str | None = None, project_type: str = "Other"
    ) -> tuple[ActivityResult, Project | None] | None:
        if not user.id or not title:
            return None

        project = Project(owner_id=user.id, title=title, description=description, project_type=project_type)
        self._db.insert(project)
        await self._db.commit()

        assigned_user = ProjectAssignedUser(project_id=cast(int, project.id), user_id=user.id)
        self._db.insert(assigned_user)

        role_service = self._get_service(RoleService)
        await role_service.project.grant_all(user_id=user.id, project_id=cast(int, project.id))

        activity_result = ActivityResult(
            user_or_bot=user,
            model=project,
            shared={"uid": project.uid},
            new=["title", "project_type"],
        )

        return activity_result, project

    @overload
    async def update(self, project: Project, form: dict, user: User) -> str: ...
    @overload
    async def update(self, project: Project, form: dict, user: User, from_bot: Literal[False]) -> str: ...
    @overload
    async def update(self, project: int, form: dict, user: None, from_bot: Literal[True]) -> None: ...
    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectUpdated)
    async def update(
        self, project: Project | int, form: dict, user: User | None = None, from_bot: bool = False
    ) -> tuple[ActivityResult, str | None] | None:
        if "id" in form:
            form.pop("id")
        if "uid" in form:
            form.pop("uid")

        if isinstance(project, int):
            result = await self._db.exec(self._db.query("select").table(Project).where(Project.id == project))
            project = cast(Project, result.first())
            if not project:
                return None

        old_project_record = {}

        for key, value in form.items():
            if hasattr(project, key):
                old_project_record[key] = getattr(project, key)
                setattr(project, key, value)

        activitiy_params = {
            "model": project,
            "activity_type": ActivityService.ACTIVITY_TYPES.ProjectUpdated,
            "shared": {"uid": project.uid},
            "new": [*list(form.keys())],
            "old": old_project_record,
        }

        if from_bot:
            await self._db.update(project)
            return ActivityResult(user_or_bot=BotType.Project, **activitiy_params), None

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(cast(Project, project), RevertType.Update)
        )
        activity_result = ActivityResult(user_or_bot=cast(User, user), revert_key=revert_key, **activitiy_params)
        return activity_result, revert_key

    @overload
    async def assign_user(
        self, user: User, project: Project, target_user: User, grant_actions: list[str] | None = None
    ) -> str | None: ...
    @overload
    async def assign_user(
        self, user: User, project: Project, target_user: int, grant_actions: list[str] | None = None
    ) -> str | None: ...
    @overload
    async def assign_user(
        self, user: User, project: int, target_user: int, grant_actions: list[str] | None = None
    ) -> str | None: ...
    @overload
    async def assign_user(
        self, user: User, project: int, target_user: User, grant_actions: list[str] | None = None
    ) -> str | None: ...
    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectAssignedUser)
    async def assign_user(
        self, user: User, project: Project | int, target_user: User | int, grant_actions: list[str] | None = None
    ) -> tuple[ActivityResult, str | None] | None:
        grant_actions = grant_actions or []
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        target_user = (
            cast(User, await self._get_service(UserService).get_by_id(target_user))
            if isinstance(target_user, int)
            else target_user
        )
        if not project or not target_user or not project.id or not target_user.id:
            raise ValueError("Project or user not found")

        result = await self._db.exec(
            self._db.query("select")
            .count(ProjectAssignedUser, ProjectAssignedUser.id)
            .where(ProjectAssignedUser.project_id == project.id)
            .where(ProjectAssignedUser.user_id == target_user.id)
        )
        (existed,) = result.first() or (None,)

        if existed:
            return

        assigned_user = ProjectAssignedUser(project_id=project.id, user_id=target_user.id)
        self._db.insert(assigned_user)

        role_service = self._get_service(RoleService)
        if grant_actions:
            role = await role_service.project.grant(
                actions=grant_actions, user_id=target_user.id, project_id=project.id
            )
        else:
            role = await role_service.project.grant_default(user_id=target_user.id, project_id=project.id)

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(assigned_user, RevertType.Delete),
            revert_service.create_record_model(role, RevertType.Delete if role.is_new() else RevertType.Update),
            only_commit=True,
        )

        activity_result = ActivityResult(
            user_or_bot=user,
            model=project,
            shared={"uid": project.uid, "user_id": target_user.id},
            new={},
            revert_key=revert_key,
        )

        return activity_result, revert_key

    @overload
    async def assign_group(
        self, user: User, project: Project, group: Group, grant_actions: list[str] | None = None
    ) -> str: ...
    @overload
    async def assign_group(
        self, user: User, project: Project, group: int, grant_actions: list[str] | None = None
    ) -> str: ...
    @overload
    async def assign_group(
        self, user: User, project: int, group: int, grant_actions: list[str] | None = None
    ) -> str: ...
    @overload
    async def assign_group(
        self, user: User, project: int, group: Group, grant_actions: list[str] | None = None
    ) -> str: ...
    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectAssignedGroup)
    async def assign_group(
        self, user: User, project: Project | int, group: Group | int, grant_actions: list[str] | None = None
    ) -> tuple[ActivityResult, str | None] | None:
        grant_actions = grant_actions or []
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        group = cast(Group, await self._get_service(GroupService).get_by_id(group)) if isinstance(group, int) else group
        if not project or not group or not project.id or not group.id:
            raise ValueError("Project or user not found")

        role_service = self._get_service(RoleService)
        if grant_actions:
            role = await role_service.project.grant(actions=grant_actions, group_id=group.id, project_id=project.id)
        else:
            role = await role_service.project.grant_default(group_id=group.id, project_id=project.id)

        query = (
            self._db.query("select")
            .tables(User, ProjectAssignedUser)
            .join(GroupAssignedUser, User.id == GroupAssignedUser.user_id)  # type: ignore
            .outerjoin(
                ProjectAssignedUser,
                (User.column("id") == ProjectAssignedUser.user_id) & (ProjectAssignedUser.project_id == project.id),
            )
            .where(GroupAssignedUser.group_id == group.id)
        )

        result = await self._db.exec(query)
        target_users = result.all()

        assigned_users: list[ProjectAssignedUser] = []
        for target_user, assigned in target_users:
            if assigned is not None or target_user.id is None:
                continue

            assigned_user = ProjectAssignedUser(project_id=project.id, user_id=target_user.id)
            assigned_users.append(assigned_user)
        self._db.insert_all(assigned_users)

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            *[
                revert_service.create_record_model(role, RevertType.Delete if role.is_new() else RevertType.Update),
                *[
                    revert_service.create_record_model(assigned_user, RevertType.Delete)
                    for assigned_user in assigned_users
                ],
            ],
            only_commit=True,
        )

        activity_result = ActivityResult(
            user_or_bot=user,
            model=project,
            shared={"uid": project.uid, "group_id": group.id},
            new={},
            revert_key=revert_key,
        )

        return activity_result, revert_key

    @overload
    async def withdraw_user(self, user: User, project: Project, target_user: User) -> str | None: ...
    @overload
    async def withdraw_user(self, user: User, project: Project, target_user: int) -> str | None: ...
    @overload
    async def withdraw_user(self, user: User, project: int, target_user: User) -> str | None: ...
    @overload
    async def withdraw_user(self, user: User, project: int, target_user: int) -> str | None: ...
    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectUnassignedUser)
    async def withdraw_user(
        self, user: User, project: Project | int, target_user: User | int
    ) -> tuple[ActivityResult, str | None] | None:
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        target_user = (
            cast(User, await self._get_service(UserService).get_by_id(target_user))
            if isinstance(target_user, int)
            else target_user
        )
        if not project or not target_user or not project.id or not target_user.id:
            raise ValueError("Project or user not found")

        if not isinstance(project, Project):
            result = await self._db.exec(
                self._db.query("select").column(Project.owner_id).where(Project.id == project.id)
            )
            owner_id = result.first()
        else:
            owner_id = project.owner_id

        if not owner_id or owner_id == target_user.id:
            return None

        role_service = self._get_service(RoleService)
        role_class = role_service.project._model_class

        role = await role_service.project.withdraw(user_id=target_user.id, project_id=project.id)

        result = await self._db.exec(
            self._db.query("select")
            .count(role_class, role_class.id)
            .join(GroupAssignedUser, role_class.group_id == GroupAssignedUser.group_id)  # type: ignore
            .where(GroupAssignedUser.user_id == target_user.id)
            .where(role_class.project_id == project.id)
        )
        (existed_in_group,) = result.first() or (None,)

        revert_service = self._get_service(RevertService)
        revert_models = []
        if role:
            revert_models.append(revert_service.create_record_model(role, RevertType.Insert))

        activity_result_params = {
            "user_or_bot": user,
            "model": project,
            "shared": {"uid": project.uid, "user_id": target_user.id},
            "new": {},
        }

        if existed_in_group:
            if revert_models:
                revert_key = await revert_service.record(*revert_models, only_commit=True)
                activity_result = ActivityResult(revert_key=revert_key, **activity_result_params)
                return activity_result, revert_key
            return None

        assigned_user = (
            await self._db.exec(
                self._db.query("select")
                .table(ProjectAssignedUser)
                .where(ProjectAssignedUser.column("project_id") == project.id)
                .where(ProjectAssignedUser.column("user_id") == target_user.id)
            )
        ).first()
        if assigned_user:
            await self._db.delete(assigned_user)
            revert_models.append(revert_service.create_record_model(assigned_user, RevertType.Insert))

        if revert_models:
            revert_key = await revert_service.record(*revert_models, only_commit=True)
            activity_result = ActivityResult(revert_key=revert_key, **activity_result_params)
            return activity_result, revert_key
        return None

    @overload
    async def withdraw_group(self, user: User, project: Project, group: Group) -> str | None: ...
    @overload
    async def withdraw_group(self, user: User, project: Project, group: int) -> str | None: ...
    @overload
    async def withdraw_group(self, user: User, project: int, group: int) -> str | None: ...
    @overload
    async def withdraw_group(self, user: User, project: int, group: Group) -> str | None: ...
    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectUnassignedGroup)
    async def withdraw_group(
        self, user: User, project: Project | int, group: Group | int
    ) -> tuple[ActivityResult, str | None] | None:
        project = cast(Project, await self.get_by_id(project) if isinstance(project, int) else project)
        group = cast(Group, await self._get_service(GroupService).get_by_id(group)) if isinstance(group, int) else group
        if not project or not group or not project.id or not group.id:
            raise ValueError("Project or user not found")

        role_service = self._get_service(RoleService)
        role_class = role_service.project._model_class

        result = await self._db.exec(
            self._db.query("select")
            .tables(ProjectAssignedUser, role_class)
            .join(User, (ProjectAssignedUser.user_id == User.id) & (User.deleted_at == None))  # type: ignore # noqa
            .join(GroupAssignedUser, User.id == GroupAssignedUser.user_id)  # type: ignore
            .join(
                Project,
                (ProjectAssignedUser.project_id == Project.id)
                & (Project.owner_id != User.id)  # type: ignore
                & (User.deleted_at == None),  # noqa
            )
            .outerjoin(
                role_class,
                (role_class.user_id == User.id) & (role_class.project_id == ProjectAssignedUser.project_id),  # type: ignore
            )
            .where(GroupAssignedUser.group_id == group.id)
            .where(ProjectAssignedUser.project_id == project.id)
        )
        results = result.all()

        assigned_users: list[ProjectAssignedUser] = [
            assigned_user
            for assigned_user, assigned_role in results
            if assigned_user is not None and assigned_role is None
        ]

        role = await role_service.project.withdraw(group_id=group.id, project_id=project.id)

        revert_service = self._get_service(RevertService)
        revert_models = []

        if role:
            revert_models.append(revert_service.create_record_model(role, RevertType.Insert))

        activity_result_params = {
            "user_or_bot": user,
            "model": project,
            "shared": {"uid": project.uid, "group_id": group.id},
            "new": {},
        }

        if not assigned_users:
            if revert_models:
                revert_key = await revert_service.record(*revert_models, only_commit=True)
                activity_result = ActivityResult(revert_key=revert_key, **activity_result_params)
                return activity_result, revert_key
            return

        revert_models.extend(
            [revert_service.create_record_model(assigned_user, RevertType.Insert) for assigned_user in assigned_users]
        )

        if revert_models:
            revert_key = await revert_service.record(*revert_models, only_commit=True)
            activity_result = ActivityResult(revert_key=revert_key, **activity_result_params)
            return activity_result, revert_key
        return
