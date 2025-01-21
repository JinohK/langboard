from json import dumps as json_dumps
from typing import Any, Literal, cast, overload
from urllib.parse import urlparse
from ...Constants import COMMON_SECRET_KEY
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...core.utils.Encryptor import Encryptor
from ...core.utils.String import concat, generate_random_string
from ...models import Project, ProjectAssignedUser, ProjectInvitation, UserEmail, UserNotification
from ...models.UserNotification import NotificationType
from ...tasks import ProjectActivityTask, UserActivityTask
from .EmailService import EmailService
from .NotificationService import NotificationService
from .RoleService import RoleService
from .Types import TProjectParam


class InvitationRelatedResult:
    def __init__(self):
        self.already_assigned_ids: list[SnowflakeID] = []
        self.already_assigned_users: list[User] = []
        self.already_assigned_user_emails: list[str] = []
        self.already_sent_user_emails: list[str] = []
        self.emails_should_invite: list[str] = []
        self.users_by_email: dict[str, User] = {}
        self.assigned_ids_should_delete: list[SnowflakeID] = []


class ProjectInvitationService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_invitation"

    @overload
    async def get_invited_users(
        self, project: TProjectParam, as_api: Literal[False]
    ) -> list[tuple[ProjectInvitation, User | None]]: ...
    @overload
    async def get_invited_users(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_invited_users(
        self, project: TProjectParam, as_api: bool
    ) -> list[tuple[ProjectInvitation, User | None]] | list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.tables(ProjectInvitation, User)
                .outerjoin(
                    UserEmail,
                    (ProjectInvitation.column("email") == UserEmail.column("email"))
                    & (UserEmail.column("deleted_at") == None),  # noqa
                )
                .outerjoin(
                    User,
                    (User.column("email") == ProjectInvitation.column("email"))
                    | (User.column("id") == UserEmail.column("user_id")),
                )
                .where(ProjectInvitation.column("project_id") == project.id)
            )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = []
        for invitation, invited_user in raw_users:
            users.append(
                invited_user.api_response()
                if invited_user
                else User.create_email_user_api_response(invitation.id, invitation.email)
            )

        return users

    async def get_project_by_token(self, user: User, token: str) -> Project | None:
        invitation = await self.__get_invitation_by_token(user, token)
        if not invitation:
            return None

        project = await self._get_by_param(Project, invitation.project_id)
        return project

    async def get_invitation_related_data(self, project: Project, emails: list[str]) -> InvitationRelatedResult:
        invitation_result = InvitationRelatedResult()
        for email in emails:
            user = await self._get_by(User, "email", email)
            if not user:
                async with DbSession.use_db() as db:
                    result = await db.exec(
                        SqlBuilder.select.tables(UserEmail, User)
                        .join(User, User.column("id") == UserEmail.column("user_id"))
                        .where(UserEmail.column("email") == email)
                    )
                _, user = result.first() or (None, None)

            if user:
                assigned_user = await self._get_by(ProjectAssignedUser, "user_id", user.id)
                if assigned_user:
                    invitation_result.already_assigned_ids.append(assigned_user.id)
                    invitation_result.already_assigned_users.append(user)
                    invitation_result.already_assigned_user_emails.append(email)
                    continue

            invitation = await self._get_by(ProjectInvitation, "email", email)
            if invitation:
                invitation_result.already_sent_user_emails.append(email)
            else:
                if user:
                    invitation_result.users_by_email[email] = user
                invitation_result.emails_should_invite.append(email)

        prev_assigned_users = await self._get_all_by(ProjectAssignedUser, "project_id", project.id)
        for assigned_user in prev_assigned_users:
            if assigned_user.user_id == project.owner_id:
                invitation_result.already_assigned_ids.append(assigned_user.id)
                continue

            if assigned_user.id not in invitation_result.already_assigned_ids:
                invitation_result.assigned_ids_should_delete.append(assigned_user.id)

        return invitation_result

    async def invite_emails(
        self,
        user: User,
        project: TProjectParam,
        lang: str,
        url: str,
        token_query_name: str,
        invitation_result: InvitationRelatedResult,
    ) -> tuple[bool, dict[str, str]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return False

        urls = {}
        email_service = self._get_service(EmailService)
        notification_service = self._get_service(NotificationService)
        for email in invitation_result.emails_should_invite:
            invitation = ProjectInvitation(project_id=project.id, email=email, token=generate_random_string(32))
            async with DbSession.use_db() as db:
                db.insert(invitation)
                await db.commit()

            token_url = await self.__create_invitation_token_url(invitation, url, token_query_name)
            await email_service.send_template(lang, email, "project_invitation", {"url": token_url})
            urls[email] = token_url

            target_user = invitation_result.users_by_email.get(email)
            if target_user:
                await notification_service.notify_project_invited(user, target_user, project, invitation)

        return True, urls

    async def accept(self, user: User, token: str) -> Literal[False] | str:
        invitation = await self.__get_invitation_by_token(user, token)
        if not invitation:
            return False

        project = await self._get_by_param(Project, invitation.project_id)
        if not project:
            return False

        await self.__delete_notification(user, project, invitation)

        assign_user = ProjectAssignedUser(project_id=invitation.project_id, user_id=user.id)

        async with DbSession.use_db() as db:
            await db.delete(invitation)
            await db.commit()

        async with DbSession.use_db() as db:
            db.insert(assign_user)
            await db.commit()

        role_service = self._get_service(RoleService)

        await role_service.project.grant_default(user_id=user.id, project_id=invitation.project_id)

        project_service = self._get_service_by_name("project")

        model = {
            "assigned_members": await project_service.get_assigned_users(project, as_api=True),
            "invited_members": await self.get_invited_users(project, as_api=True),
            "invitation_uid": invitation.get_uid(),
        }

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:assigned-users:updated:{project.get_uid()}",
            data_keys=list(model.keys()),
        )
        SocketPublishService.put_dispather(model, publish_model)

        ProjectActivityTask.project_invited_user_accepted(user, project)

        return project.get_uid()

    async def decline(self, user: User, token: str) -> bool:
        invitation = await self.__get_invitation_by_token(user, token)
        if not invitation:
            return False

        project = await self._get_by_param(Project, invitation.project_id)
        if not project:
            return False

        await self.__delete_notification(user, project, invitation)

        async with DbSession.use_db() as db:
            await db.delete(invitation)
            await db.commit()

        UserActivityTask.declined_project_invitation(user, project)

        return True

    async def __create_invitation_token_url(
        self, invitation: ProjectInvitation, url: str, token_query_name: str
    ) -> str:
        encrypted_token = Encryptor.encrypt(invitation.create_encrypted_token(), COMMON_SECRET_KEY)

        url_chunks = urlparse(url)
        token_url = url_chunks._replace(
            query=concat(
                url_chunks.query,
                "&" if url_chunks.query else "",
                token_query_name,
                "=",
                encrypted_token,
            )
        ).geturl()

        return token_url

    async def __get_invitation_by_token(self, user: User, token: str) -> ProjectInvitation | None:
        invitation_token, invitation_id = ProjectInvitation.validate_token(token) or (None, None)
        if not invitation_token or not invitation_id:
            return None

        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectInvitation).where(
                    (ProjectInvitation.column("id") == invitation_id)
                    & (ProjectInvitation.column("token") == invitation_token)
                )
            )
        invitation = result.first()
        if not invitation:
            return None

        if user.email != invitation.email:
            subemails = [subemail.email for subemail in await self._get_all_by(UserEmail, "user_id", user.id)]
            if invitation.email not in subemails:
                return None

        return invitation

    async def __delete_notification(self, user: User, project: Project, invitation: ProjectInvitation):
        notification_service = self._get_service(NotificationService)
        record_list = json_dumps(
            notification_service.create_record_list([(project, "project"), (invitation, "invitation")])
        )
        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.table(UserNotification).where(
                    (UserNotification.column("receiver_id") == user.id)
                    & (UserNotification.column("notification_type") == NotificationType.ProjectInvited)
                    & (UserNotification.column("record_list") == record_list)
                )
            )
        notification = result.first()
        if not notification:
            return

        async with DbSession.use_db() as db:
            await db.delete(notification)
            await db.commit()

        model = {"notification_uid": notification.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.UserPrivate,
            topic_id=user.get_uid(),
            event="user:notification:deleted",
            data_keys="notification_uid",
        )
        SocketPublishService.put_dispather(model, publish_model)
