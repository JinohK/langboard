from typing import Any, Literal, cast, overload
from ...core.ai import BotType
from ...core.ai.QueueBot import QueueBot, QueueBotModel
from ...core.db import SnowflakeID, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...core.utils.DateTime import now
from ...models import (
    Card,
    CardAssignedUser,
    Checkitem,
    CheckitemAssignedUser,
    Project,
    ProjectAssignedUser,
    ProjectRole,
    UserEmail,
)
from ...models.BaseRoleModel import ALL_GRANTED
from .ProjectColumnService import ProjectColumnService
from .ProjectInvitationService import ProjectInvitationService
from .ProjectLabelService import ProjectLabelService
from .RevertService import RevertService, RevertType
from .RoleService import RoleService
from .Types import TProjectParam


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
    async def get_assigned_users(
        self, project: TProjectParam, as_api: Literal[False]
    ) -> list[tuple[User, ProjectAssignedUser]]: ...
    @overload
    async def get_assigned_users(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_users(
        self, project: TProjectParam, as_api: bool
    ) -> list[tuple[User, ProjectAssignedUser]] | list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
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

    async def get_dashboard_list(
        self, user: User, list_type: Literal["all", "starred", "recent", "unstarred"] | str
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
        sql_query = sql_query.group_by(*group_bys)

        result = await self._db.exec(sql_query)
        raw_projects = result.all()

        column_service = self._get_service(ProjectColumnService)

        projects = []
        for project, assigned_user in raw_projects:
            columns = await column_service.get_list(project)
            project_dict = project.api_response()
            project_dict["starred"] = assigned_user.starred
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
        response["members"] = await self.get_assigned_users(project, as_api=True)
        response["current_user_role_actions"] = await self.get_user_role_actions(user, project)
        response["labels"] = await self._get_service(ProjectLabelService).get_all(project, as_api=True)

        invitation_service = self._get_service(ProjectInvitationService)
        response["invited_users"] = []
        invited_users = await invitation_service.get_invited_users(project)
        for invitation, invited_user in invited_users:
            if invited_user:
                response["invited_users"].append(invited_user.api_response())
            else:
                response["invited_users"].append(invitation_service.convert_none_user_api_response(invitation.email))

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
        self, user_or_bot: User | BotType, project: TProjectParam, form: dict
    ) -> SocketModelIdBaseResult[tuple[str | None, dict[str, Any]]] | Literal[True] | None:
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

        if isinstance(user_or_bot, BotType):
            await self._db.update(project)
            await self._db.commit()
            revert_key = None
        else:
            revert_service = self._get_service(RevertService)
            revert_key = await revert_service.record(revert_service.create_record_model(project, RevertType.Update))

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

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_project_record:
                continue
            model[key] = self._convert_to_python(getattr(project, key))
        model_id = await SocketModelIdService.create_model_id(model)

        publish_models: list[SocketPublishModel] = []
        for key in model:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Project,
                    topic_id=project.get_uid(),
                    event=f"project:{key}:changed:{project.get_uid()}",
                    data_keys=key,
                )
            )

        return SocketModelIdBaseResult(model_id, (revert_key, model), publish_models)

    async def update_assign_users(
        self, user: User, project: TProjectParam, lang: str, url: str, token_query_name: str, emails: list[str]
    ) -> SocketModelIdBaseResult[dict[str, str]] | None:
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

        prev_assigned_users = await self._get_all_by(ProjectAssignedUser, "project_id", project.id)
        updated_checkitem_ids: set[SnowflakeID] = set()
        updated_card_ids: set[SnowflakeID] = set()
        for prev_assigned_user in prev_assigned_users:
            if project.owner_id == prev_assigned_user.user_id or prev_assigned_user.id in assigned_user_ids:
                continue

            checkitem_assigned_users = (
                await self._db.exec(
                    self._db.query("select")
                    .table(CheckitemAssignedUser)
                    .join(Checkitem, Checkitem.column("id") == CheckitemAssignedUser.column("checkitem_id"))
                    .join(Card, Card.column("id") == Checkitem.column("card_id"))
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

        model_id = await SocketModelIdService.create_model_id(
            {
                "project_members": [assigned_user.api_response() for assigned_user in updated_assigned_users],
                "project_invited_users": invited_users,
            }
        )

        publish_models: list[SocketPublishModel] = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=project.get_uid(),
                event=f"board:assigned-users:updated:{project.get_uid()}",
                data_keys=["assigned_users", "invited_users"],
            )
        ]

        checkitem_service = self._get_service_by_name("checkitem")
        for checkitem_id in updated_checkitem_ids:
            checkitem = await self._get_by(Checkitem, "id", checkitem_id)
            if not checkitem:
                continue
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Board,
                    topic_id=project.get_uid(),
                    event=f"board:card:checkitem:assigned-users:updated:{project.get_uid()}",
                    custom_data={"assigned_users": await checkitem_service.get_assigned_users(checkitem, as_api=True)},
                )
            )

        card_service = self._get_service_by_name("card")
        for card_id in updated_card_ids:
            card = await self._get_by(Card, "id", card_id)
            if not card:
                continue
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Board,
                    topic_id=project.get_uid(),
                    event=f"board:card:assigned-users:updated:{project.get_uid()}",
                    custom_data={"assigned_users": await card_service.get_assigned_users(card, as_api=True)},
                )
            )

        return SocketModelIdBaseResult(model_id, urls, publish_models)
