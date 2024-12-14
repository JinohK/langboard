from datetime import datetime
from typing import Any, Literal, cast, overload
from pydantic import BaseModel
from ...core.ai import BotType
from ...core.ai.QueueBot import QueueBot, QueueBotModel
from ...core.schema import Pagination
from ...core.service import BaseService
from ...core.utils.DateTime import now
from ...models import (
    Card,
    CardAssignedUser,
    Checkitem,
    CheckitemAssignedUser,
    Project,
    ProjectAssignedUser,
    ProjectColumn,
    ProjectRole,
    User,
    UserGroup,
    UserGroupAssignedUser,
)
from ...models.BaseRoleModel import ALL_GRANTED
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
        roles = await role_service.project.get_roles(user_id=user.id, project_id=cast(int, project.id))
        return roles[0].actions if roles else []

    @overload
    async def get_assigned_users(self, project: int) -> list[dict[str, Any]]: ...
    @overload
    async def get_assigned_users(self, project: Project) -> list[dict[str, Any]]: ...
    async def get_assigned_users(self, project: Project | int) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .table(User)
            .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.user_id)
            .where(ProjectAssignedUser.project_id == (project.id if isinstance(project, Project) else project))
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
            .tables(Project, ProjectAssignedUser)
            .join(ProjectAssignedUser, Project.column("id") == ProjectAssignedUser.column("project_id"))
            .outerjoin(ProjectRole, Project.column("id") == ProjectRole.column("project_id"))
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
        for project, assigned_user in raw_projects:
            columns = await self.get_columns(project)
            project_dict = project.api_response()
            project_dict["starred"] = assigned_user.starred
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
    async def update(self, user_or_bot: BotType, project: int, form: dict) -> None: ...
    @overload
    async def update(self, user_or_bot: User, project: Project | int, form: dict) -> str | None: ...
    async def update(self, user_or_bot: User | BotType, project: Project | int, form: dict) -> str | None:
        for immutable_key in ["id", "uid", "owner_id"]:
            if immutable_key in form:
                form.pop(immutable_key)

        if isinstance(project, int):
            project = cast(Project, await self.get_by_id(project))
            if not project:
                return None

        old_project_record = {}

        for key, value in form.items():
            if hasattr(project, key):
                old_project_record[key] = getattr(project, key)
                if isinstance(old_project_record[key], BaseModel):
                    old_project_record[key] = old_project_record[key].model_dump()
                elif isinstance(old_project_record[key], datetime):
                    old_project_record[key] = old_project_record[key].isoformat()
                setattr(project, key, value)

        activitiy_params = {
            "user_or_bot": user_or_bot,
            "model": project,
            "shared": {"project_uid": project.uid},
            "new": [*list(form.keys())],
            "old": old_project_record,
        }

        if isinstance(user_or_bot, BotType):
            await self._db.update(project)
            await self._db.commit()
            revert_key = None
        else:
            revert_service = self._get_service(RevertService)
            revert_key = await revert_service.record(revert_service.create_record_model(project, RevertType.Update))
            activitiy_params["revert_key"] = revert_key

            QueueBot.add(
                QueueBotModel(
                    bot_type=BotType.Project,
                    bot_data={
                        "title": project.title,
                        "description": project.description,
                        "project_type": project.project_type,
                    },
                    service_name=ProjectService.name(),
                    service_method="update",
                    params={"project": project.id, "form": {"ai_description": "{output}"}},
                )
            )

        return revert_key

    async def assign_user(
        self, user: User, project: Project | int, target_user: User | int, grant_actions: list[str] | None = None
    ) -> str | None:
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

        return revert_key

    async def assign_group(
        self, user: User, project: Project | int, user_group: UserGroup | int, grant_actions: list[str] | None = None
    ) -> str | None:
        grant_actions = grant_actions or []
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        user_group = (
            cast(UserGroup, await self._get_by(UserGroup, "id", user_group))
            if isinstance(user_group, int)
            else user_group
        )
        if not project or not user_group or not project.id or not user_group.id or user_group.user_id != user.id:
            raise ValueError("Project or user not found")

        result = await self._db.exec(
            self._db.query("select")
            .table(User)
            .join(UserGroupAssignedUser, User.column("id") == UserGroupAssignedUser.column("user_id"))
        )

        role_service = self._get_service(RoleService)
        query = (
            self._db.query("select")
            .tables(User, ProjectAssignedUser)
            .join(UserGroupAssignedUser, User.column("id") == UserGroupAssignedUser.user_id)
            .outerjoin(
                ProjectAssignedUser,
                (User.column("id") == ProjectAssignedUser.user_id) & (ProjectAssignedUser.project_id == project.id),
            )
            .where(
                (UserGroupAssignedUser.column("group_id") == user_group.id)
                & (User.column("id") != project.owner_id)
                & (User.column("id") != user.id)
            )
        )

        result = await self._db.exec(query)
        target_users = result.all()

        assign_users: list[ProjectAssignedUser] = []
        roles: list[ProjectRole] = []
        for target_user, assigned in target_users:
            if assigned is not None or target_user.id is None:
                continue

            assign_user = ProjectAssignedUser(project_id=project.id, user_id=target_user.id)
            assign_users.append(assign_user)
            if grant_actions:
                role = await role_service.project.grant(
                    actions=grant_actions, user_id=target_user.id, project_id=project.id
                )
            else:
                role = await role_service.project.grant_default(user_id=target_user.id, project_id=project.id)
            roles.append(role)

        self._db.insert_all(assign_users)

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            *[
                *[revert_service.create_record_model(role, RevertType.Delete) for role in roles],
                *[revert_service.create_record_model(assign_user, RevertType.Delete) for assign_user in assign_users],
            ],
            only_commit=True,
        )

        return revert_key

    async def withdraw_user(self, user: User, project: Project | int, target_user: User | int) -> str | None:
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        target_user = (
            cast(User, await self._get_by(User, "id", target_user)) if isinstance(target_user, int) else target_user
        )
        if not project or not target_user or not project.id or not target_user.id:
            raise ValueError("Project or user not found")

        if not project.owner_id or project.owner_id == target_user.id:
            return None

        role_service = self._get_service(RoleService)

        role = await role_service.project.withdraw(user_id=target_user.id, project_id=project.id)

        revert_service = self._get_service(RevertService)
        revert_models = []
        if role:
            revert_models.append(revert_service.create_record_model(role, RevertType.Insert))

        assigned_user = (
            await self._db.exec(
                self._db.query("select")
                .table(ProjectAssignedUser)
                .where(
                    (ProjectAssignedUser.column("project_id") == project.id)
                    & (ProjectAssignedUser.column("user_id") == target_user.id)
                )
                .limit(1)
            )
        ).first()
        if assigned_user:
            await self._db.delete(assigned_user)
            revert_models.append(revert_service.create_record_model(assigned_user, RevertType.Insert))

        checkitem_assigned_users = (
            await self._db.exec(
                self._db.query("select")
                .table(CheckitemAssignedUser)
                .join(Checkitem, Checkitem.column("id") == CheckitemAssignedUser.column("checkitem_id"))
                .join(Card, Card.column("uid") == Checkitem.column("card_uid"))
                .where(
                    (Card.column("project_id") == project.id)
                    & (CheckitemAssignedUser.column("user_id") == target_user.id)
                )
            )
        ).all()
        for checkitem_assigned_user in checkitem_assigned_users:
            await self._db.delete(checkitem_assigned_user)
            revert_models.append(revert_service.create_record_model(checkitem_assigned_user, RevertType.Insert))

        card_assigned_users = (
            await self._db.exec(
                self._db.query("select")
                .table(CardAssignedUser)
                .join(Card, Card.column("id") == CardAssignedUser.column("card_id"))
                .where(
                    (Card.column("project_id") == project.id) & (CardAssignedUser.column("user_id") == target_user.id)
                )
            )
        ).all()
        for card_assigned_user in card_assigned_users:
            await self._db.delete(card_assigned_user)
            revert_models.append(revert_service.create_record_model(card_assigned_user, RevertType.Insert))

        if revert_models:
            revert_key = await revert_service.record(*revert_models, only_commit=True)
            return revert_key
        return None
