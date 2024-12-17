from datetime import datetime
from typing import Any, Literal, cast, overload
from pydantic import BaseModel
from ...core.ai import BotType
from ...core.ai.QueueBot import QueueBot, QueueBotModel
from ...core.schema import Pagination
from ...core.service import BaseService, ModelIdBaseResult, ModelIdService
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
    UserEmail,
)
from ...models.BaseRoleModel import ALL_GRANTED
from .ProjectColumnService import ProjectColumnService
from .ProjectInvitationService import ProjectInvitationService
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
    async def get_assigned_users(self, project: Project | int, as_api: Literal[False]) -> list[User]: ...
    @overload
    async def get_assigned_users(self, project: Project | int, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_users(self, project: Project | int, as_api: bool) -> list[User] | list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .table(User)
            .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.user_id)
            .where(ProjectAssignedUser.project_id == (project.id if isinstance(project, Project) else project))
        )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user in raw_users]
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

    async def update_assign_users(
        self, user: User, project: Project | int, lang: str, url: str, token_query_name: str, emails: list[str]
    ) -> ModelIdBaseResult[dict[str, str]] | None:
        project = cast(Project, await self.get_by_id(project)) if isinstance(project, int) else project
        if not project or not project.id:
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
                & (ProjectAssignedUser.column("project_id") == project.id)
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

        prev_assigned_users = await self._get_all_by(ProjectAssignedUser, "project_id", project.id)
        updated_checkitem_ids: set[int] = set()
        updated_card_ids: set[int] = set()
        for prev_assigned_user in prev_assigned_users:
            if project.owner_id == prev_assigned_user.user_id or prev_assigned_user.id in assigned_user_ids:
                continue

            checkitem_assigned_users = (
                await self._db.exec(
                    self._db.query("select")
                    .table(CheckitemAssignedUser)
                    .join(Checkitem, Checkitem.column("id") == CheckitemAssignedUser.column("checkitem_id"))
                    .join(Card, Card.column("uid") == Checkitem.column("card_uid"))
                    .where(
                        (Card.column("project_id") == project.id)
                        & (CheckitemAssignedUser.column("user_id") == prev_assigned_user.user_id)
                    )
                )
            ).all()
            for checkitem_assigned_user in checkitem_assigned_users:
                updated_checkitem_ids.add(checkitem_assigned_user.checkitem_id)
                await self._db.delete(checkitem_assigned_user)

            card_assigned_users = (
                await self._db.exec(
                    self._db.query("select")
                    .table(CardAssignedUser)
                    .join(Card, Card.column("id") == CardAssignedUser.column("card_id"))
                    .where(
                        (Card.column("project_id") == project.id)
                        & (CardAssignedUser.column("user_id") == prev_assigned_user.user_id)
                    )
                )
            ).all()
            for card_assigned_user in card_assigned_users:
                updated_card_ids.add(card_assigned_user.card_id)
                await self._db.delete(card_assigned_user)

            await self._db.delete(prev_assigned_user)

        await self._db.commit()

        project_invitation_service = self._get_service(ProjectInvitationService)
        _, invited_users, urls = await project_invitation_service.invite_emails(
            user, project, lang, url, token_query_name, inviting_emails
        )

        updated_checkitems: dict[str, list[dict[str, Any]]] = {}
        for checkitem_id in updated_checkitem_ids:
            checkitem = await self._get_by(Checkitem, "id", checkitem_id)
            if not checkitem:
                continue
            result = await self._db.exec(
                self._db.query("select")
                .table(User)
                .join(CheckitemAssignedUser, User.column("id") == CheckitemAssignedUser.column("user_id"))
                .where(CheckitemAssignedUser.column("checkitem_id") == checkitem_id)
            )
            updated_checkitems[checkitem.uid] = [checkitem_user.api_response() for checkitem_user in result.all()]

        updated_cards: dict[str, list[dict[str, Any]]] = {}
        for card_id in updated_card_ids:
            card = await self._get_by(Card, "id", card_id)
            if not card:
                continue
            result = await self._db.exec(
                self._db.query("select")
                .table(User)
                .join(CardAssignedUser, User.column("id") == CardAssignedUser.column("user_id"))
                .where(CardAssignedUser.column("card_id") == card_id)
            )
            updated_cards[card.uid] = [card_user.api_response() for card_user in result.all()]

        model_id = await ModelIdService.create_model_id(
            {
                "project_members": [assigned_user.api_response() for assigned_user in updated_assigned_users],
                "project_invited_users": invited_users,
                "checkitem_members": updated_checkitems,
                "card_members": updated_cards,
            }
        )

        return ModelIdBaseResult(model_id, urls)
