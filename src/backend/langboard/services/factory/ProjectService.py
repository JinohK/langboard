from typing import Any, Literal, cast, overload
from sqlalchemy import func
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
from .ProjectColumnService import ProjectColumnService
from .RevertService import RevertService, RevertType
from .RoleService import RoleService


class ProjectService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project"

    async def get_by_id(self, project_id: int) -> Project | None:
        return await self._get_by(Project, "id", project_id)

    async def get_by_uid(self, uid: str) -> Project | None:
        return await self._get_by(Project, "uid", uid)

    async def get_columns(self, project: Project) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectColumn)
            .where(ProjectColumn.column("project_id") == project.id)
            .order_by(ProjectColumn.column("order").asc())
            .group_by(ProjectColumn.column("order"))
        )
        raw_columns = result.all()
        columns = [raw_column.api_response() for raw_column in raw_columns]
        columns.insert(
            project.archive_column_order,
            {
                "uid": Project.ARCHIVE_COLUMN_UID,
                "name": project.archive_column_name,
                "order": project.archive_column_order,
            },
        )
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
            .join(GroupAssignedUser, role_class.column("group_id") == GroupAssignedUser.column("group_id"))
            .where(GroupAssignedUser.column("user_id") == user.id)
            .limit(1)
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
    ) -> list[dict[str, Any]]:
        if list_type not in ["all", "starred", "recent", "unstarred"]:
            return []

        sql_query = (
            self._db.query("select")
            .tables(Project, ProjectAssignedUser, func.aggregate_strings(Group.column("name"), ","))
            .join(ProjectAssignedUser, Project.column("id") == ProjectAssignedUser.column("project_id"))
            .outerjoin(ProjectRole, Project.column("id") == ProjectRole.column("project_id"))
            .outerjoin(
                Group,
                (ProjectRole.column("group_id") == Group.column("id")) & (Group.column("deleted_at") == None),  # noqa
            )
            .where(ProjectAssignedUser.column("user_id") == user.id)
        )

        descs = [Project.column("updated_at").desc(), Project.column("id").desc()]
        group_bys = [Project.column("id"), ProjectAssignedUser.column("starred")]

        if list_type == "starred":
            sql_query = sql_query.where(ProjectAssignedUser.column("starred") == True)  # noqa
        elif list_type == "recent":
            descs.insert(0, ProjectAssignedUser.column("last_viewed_at").desc())
            group_bys.append(ProjectAssignedUser.column("last_viewed_at"))
        elif list_type == "unstarred":
            sql_query = sql_query.where(ProjectAssignedUser.column("starred") == False)  # noqa

        sql_query = sql_query.order_by(*descs)
        sql_query = self.paginate(sql_query, pagination.page, pagination.limit)
        sql_query = sql_query.group_by(*group_bys)

        result = await self._db.exec(sql_query)
        raw_projects = result.all()

        column_service = self._get_service(ProjectColumnService)

        projects = []
        for project, assigned_user, group_names in raw_projects:
            columns = await self.get_columns(project)
            project_dict = project.api_response()
            project_dict["starred"] = assigned_user.starred
            project_dict["group_names"] = group_names.split(",") if group_names else []
            project_dict["columns"] = [
                {
                    "name": column["name"],
                    "count": await column_service.count_cards(cast(int, project.id), column["uid"]),
                }
                for column in columns
            ]
            projects.append(project_dict)

        return projects

    async def toggle_star(self, user: User, uid: str, commit: bool = True) -> bool:
        result = await self._db.exec(
            self._db.query("select")
            .columns(ProjectAssignedUser.starred, Project.id)
            .join(ProjectAssignedUser, Project.column("id") == ProjectAssignedUser.project_id)
            .where(Project.column("uid") == uid)
            .where(ProjectAssignedUser.column("user_id") == user.id)
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

    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectCreated)
    async def create(
        self, user: User, title: str, description: str | None = None, project_type: str = "Other"
    ) -> tuple[ActivityResult, Project] | None:
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
            shared={"project_uid": project.uid},
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
            project = cast(Project, await self.get_by_id(project))
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
            "shared": {"project_uid": project.uid},
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

    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectAssignedUser)
    async def assign_user(
        self, user: User, project: Project | int, target_user: User | int, grant_actions: list[str] | None = None
    ) -> tuple[ActivityResult, str] | None:
        grant_actions = grant_actions or []
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        target_user = (
            cast(User, await self._get_by(User, "id", target_user)) if isinstance(target_user, int) else target_user
        )
        if not project or not target_user or not project.id or not target_user.id:
            raise ValueError("Project or user not found")

        if not project.owner_id or project.owner_id == target_user.id:
            return None

        result = await self._db.exec(
            self._db.query("select")
            .count(ProjectAssignedUser, ProjectAssignedUser.id)
            .where(ProjectAssignedUser.project_id == project.id)
            .where(ProjectAssignedUser.user_id == target_user.id)
        )
        existed = result.one()

        if existed:
            return None

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
            shared={"project_uid": project.uid, "user_id": target_user.id, "project_id": project.id},
            new={},
            revert_key=revert_key,
        )

        return activity_result, revert_key

    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectAssignedGroup)
    async def assign_group(
        self, user: User, project: Project | int, group: Group | int, grant_actions: list[str] | None = None
    ) -> tuple[ActivityResult, str] | None:
        grant_actions = grant_actions or []
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        group = cast(Group, await self._get_by(Group, "id", group)) if isinstance(group, int) else group
        if not project or not group or not project.id or not group.id:
            raise ValueError("Project or user not found")

        result = await self._db.exec(
            self._db.query("select")
            .table(User)
            .join(GroupAssignedUser, User.column("id") == GroupAssignedUser.column("user_id"))
        )

        role_service = self._get_service(RoleService)
        query = (
            self._db.query("select")
            .tables(User, ProjectAssignedUser)
            .join(GroupAssignedUser, User.column("id") == GroupAssignedUser.user_id)
            .outerjoin(
                ProjectAssignedUser,
                (User.column("id") == ProjectAssignedUser.user_id) & (ProjectAssignedUser.project_id == project.id),
            )
            .where(GroupAssignedUser.group_id == group.id)
        )

        result = await self._db.exec(query)
        target_users = result.all()

        assigned_users: list[ProjectAssignedUser] = []
        roles: list[ProjectRole] = []
        for target_user, assigned in target_users:
            if assigned is not None or target_user.id is None:
                continue

            assigned_user = ProjectAssignedUser(project_id=project.id, user_id=target_user.id)
            assigned_users.append(assigned_user)
            if grant_actions:
                role = await role_service.project.grant(
                    actions=grant_actions, user_id=target_user.id, project_id=project.id
                )
            else:
                role = await role_service.project.grant_default(user_id=target_user.id, project_id=project.id)
            roles.append(role)

        self._db.insert_all(assigned_users)

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            *[
                *[revert_service.create_record_model(role, RevertType.Delete) for role in roles],
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
            shared={"project_uid": project.uid, "group_id": group.id, "project_id": project.id},
            new={
                "user_ids": [assigned_user.user_id for assigned_user in assigned_users],
            },
            revert_key=revert_key,
        )

        return activity_result, revert_key

    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectUnassignedUser)
    async def withdraw_user(
        self, user: User, project: Project | int, target_user: User | int
    ) -> tuple[ActivityResult, str] | None:
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        target_user = (
            cast(User, await self._get_by(User, "id", target_user)) if isinstance(target_user, int) else target_user
        )
        if not project or not target_user or not project.id or not target_user.id:
            raise ValueError("Project or user not found")

        if not project.owner_id or project.owner_id == target_user.id:
            return None

        role_service = self._get_service(RoleService)
        role_class = role_service.project._model_class

        role = await role_service.project.withdraw(user_id=target_user.id, project_id=project.id)

        result = await self._db.exec(
            self._db.query("select")
            .count(role_class, role_class.id)
            .join(GroupAssignedUser, role_class.column("group_id") == GroupAssignedUser.column("group_id"))
            .where(GroupAssignedUser.column("user_id") == target_user.id)
            .where(role_class.column("project_id") == project.id)
        )
        existed_in_group = result.one()

        revert_service = self._get_service(RevertService)
        revert_models = []
        if role:
            revert_models.append(revert_service.create_record_model(role, RevertType.Insert))

        activity_result_params = {
            "user_or_bot": user,
            "model": project,
            "shared": {"project_uid": project.uid, "user_id": target_user.id, "project_id": project.id},
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
                .limit(1)
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
