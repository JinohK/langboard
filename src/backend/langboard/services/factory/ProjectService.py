from typing import Any, Literal, cast, overload
from sqlalchemy import func
from sqlmodel import desc
from sqlmodel.sql.expression import Select
from ...core.schema import Pagination
from ...models import Group, GroupAssignedUser, Project, ProjectAssignedUser, ProjectRole, User
from ..BaseService import BaseService
from .RevertService import RevertService, RevertType
from .RoleService import RoleService


class ProjectService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project"

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

    async def create(
        self, user: User, title: str, description: str | None = None, project_type: str = "Other"
    ) -> Project | None:
        if not user.id or not title:
            return None

        project = Project(owner_id=user.id, title=title, description=description, project_type=project_type)
        self._db.insert(project)
        await self._db.commit()

        assigned_user = ProjectAssignedUser(project_id=cast(int, project.id), user_id=user.id)
        self._db.insert(assigned_user)

        role_service = self._get_service(RoleService)
        await role_service.project.grant_all(user_id=user.id, project_id=cast(int, project.id))

        await self._db.commit()

        return project

    @overload
    async def update(self, project: Project, form: dict) -> str: ...
    @overload
    async def update(self, project: Project, form: dict, from_bot: Literal[False]) -> str: ...
    @overload
    async def update(self, project: int, form: dict, from_bot: Literal[True]) -> None: ...
    async def update(self, project: Project | int, form: dict, from_bot: bool = False) -> str | None:
        if "id" in form:
            form.pop("id")

        if from_bot:
            await self._db.exec(
                self._db.query("update").table(Project).values(form).where(Project.id == cast(int, project))  # type: ignore
            )
            await self._db.commit()
            return

        for key, value in form.items():
            if hasattr(project, key):
                setattr(project, key, value)

        revert_key = await self._get_service(RevertService).record(cast(Project, project), RevertType.Update)
        return revert_key

    @overload
    async def assign_user(
        self, project: Project, user: User, grant_actions: list[str] = [], commit: bool = True
    ) -> None: ...
    @overload
    async def assign_user(
        self, project: Project, user: int, grant_actions: list[str] = [], commit: bool = True
    ) -> None: ...
    @overload
    async def assign_user(
        self, project: int, user: int, grant_actions: list[str] = [], commit: bool = True
    ) -> None: ...
    @overload
    async def assign_user(
        self, project: int, user: User, grant_actions: list[str] = [], commit: bool = True
    ) -> None: ...
    async def assign_user(
        self, project: Project | int, user: User | int, grant_actions: list[str] = [], commit: bool = True
    ) -> None:
        project_id = project.id if isinstance(project, Project) else project
        user_id = user.id if isinstance(user, User) else user

        if not project_id or not user_id:
            raise ValueError("Project or user not found")

        result = await self._db.exec(
            self._db.query("select")
            .count(ProjectAssignedUser, ProjectAssignedUser.id)
            .where(ProjectAssignedUser.project_id == project_id)
            .where(ProjectAssignedUser.user_id == user_id)
        )
        (existed,) = result.one()

        if existed:
            return

        assigned_user = ProjectAssignedUser(project_id=project_id, user_id=user_id)
        self._db.insert(assigned_user)

        role_service = self._get_service(RoleService)

        if grant_actions:
            await role_service.project.grant(actions=grant_actions, user_id=user_id, project_id=project_id)
        else:
            await role_service.project.grant_default(user_id=user_id, project_id=project_id)

        if commit:
            await self._db.commit()

    @overload
    async def assign_group(
        self, project: Project, group: Group, grant_actions: list[str] = [], commit: bool = True
    ) -> None: ...
    @overload
    async def assign_group(
        self, project: Project, group: int, grant_actions: list[str] = [], commit: bool = True
    ) -> None: ...
    @overload
    async def assign_group(
        self, project: int, group: int, grant_actions: list[str] = [], commit: bool = True
    ) -> None: ...
    @overload
    async def assign_group(
        self, project: int, group: Group, grant_actions: list[str] = [], commit: bool = True
    ) -> None: ...
    async def assign_group(
        self, project: Project | int, group: Group | int, grant_actions: list[str] = [], commit: bool = True
    ) -> None:
        project_id = project.id if isinstance(project, Project) else project
        group_id = group.id if isinstance(group, Group) else group

        if not project_id or not group_id:
            raise ValueError("Project or group not found")

        role_service = self._get_service(RoleService)

        if grant_actions:
            await role_service.project.grant(actions=grant_actions, group_id=group_id, project_id=project_id)
        else:
            await role_service.project.grant_default(group_id=group_id, project_id=project_id)

        query = (
            self._db.query("select")
            .tables(User, ProjectAssignedUser)
            .join(GroupAssignedUser, User.id == GroupAssignedUser.user_id)  # type: ignore
            .outerjoin(
                ProjectAssignedUser,
                (User.id == ProjectAssignedUser.user_id) & (ProjectAssignedUser.project_id == project_id),  # type: ignore
            )
            .where(GroupAssignedUser.group_id == group_id)
        )

        result = await self._db.exec(query)
        users = result.all()

        assigned_users: list[ProjectAssignedUser] = []

        for user, assigned in users:
            if assigned is not None or user.id is None:
                continue

            assigned_user = ProjectAssignedUser(project_id=project_id, user_id=user.id)
            assigned_users.append(assigned_user)

        self._db.insert_all(assigned_users)
        if commit:
            await self._db.commit()

    @overload
    async def withdraw_user(self, project: Project, user: User, commit: bool = True) -> None: ...
    @overload
    async def withdraw_user(self, project: Project, user: int, commit: bool = True) -> None: ...
    @overload
    async def withdraw_user(self, project: int, user: User, commit: bool = True) -> None: ...
    @overload
    async def withdraw_user(self, project: int, user: int, commit: bool = True) -> None: ...
    async def withdraw_user(self, project: Project | int, user: User | int, commit: bool = True) -> None:
        project_id = project.id if isinstance(project, Project) else project
        user_id = user.id if isinstance(user, User) else user

        if not project_id or not user_id:
            raise ValueError("Project or user not found")

        if not isinstance(project, Project):
            result = await self._db.exec(
                self._db.query("select").column(Project.owner_id).where(Project.id == project_id)
            )
            owner_id = result.first()
        else:
            owner_id = project.owner_id

        if not owner_id or owner_id == user_id:
            return

        role_service = self._get_service(RoleService)
        role_class = role_service.project._model_class

        await role_service.project.withdraw(user_id=user_id, project_id=project_id)

        result = await self._db.exec(
            self._db.query("select")
            .count(role_class, role_class.id)
            .join(GroupAssignedUser, role_class.group_id == GroupAssignedUser.group_id)  # type: ignore
            .where(GroupAssignedUser.user_id == user_id)
            .where(role_class.project_id == project_id)
        )
        (existed_in_group,) = result.one()

        if existed_in_group:
            if commit:
                await self._db.commit()
            return

        await self._db.exec(
            self._db.query("delete")
            .table(ProjectAssignedUser)
            .where(ProjectAssignedUser.project_id == project_id)  # type: ignore
            .where(ProjectAssignedUser.user_id == user_id)  # type: ignore
        )

        if commit:
            await self._db.commit()

    @overload
    async def withdraw_group(self, project: Project, group: Group, commit: bool = True) -> None: ...
    @overload
    async def withdraw_group(self, project: Project, group: int, commit: bool = True) -> None: ...
    @overload
    async def withdraw_group(self, project: int, group: int, commit: bool = True) -> None: ...
    @overload
    async def withdraw_group(self, project: int, group: Group, commit: bool = True) -> None: ...
    async def withdraw_group(self, project: Project | int, group: Group | int, commit: bool = True) -> None:
        project_id = project.id if isinstance(project, Project) else project
        group_id = group.id if isinstance(group, Group) else group

        if not project_id or not group_id:
            raise ValueError("Project or group not found")

        role_service = self._get_service(RoleService)
        role_class = role_service.project._model_class

        result = await self._db.exec(
            self._db.query("select")
            .columns(ProjectAssignedUser.id, role_class.id)
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
            .where(GroupAssignedUser.group_id == group_id)
            .where(ProjectAssignedUser.project_id == project_id)
        )
        results = result.all()

        assigned_user_ids: list[int] = [
            assigned_user_id
            for assigned_user_id, role_id in results
            if assigned_user_id is not None and role_id is None
        ]

        await role_service.project.withdraw(group_id=group_id, project_id=project_id)

        if not assigned_user_ids:
            if commit:
                await self._db.commit()
            return

        query = self._db.query("delete").table(ProjectAssignedUser)

        if len(assigned_user_ids) == 1:
            query = query.where(ProjectAssignedUser.id == assigned_user_ids[0])  # type: ignore
        else:
            query = query.where(ProjectAssignedUser.column("id", int).in_(assigned_user_ids))

        await self._db.exec(query)
        if commit:
            await self._db.commit()
