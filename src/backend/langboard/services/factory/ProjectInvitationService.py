from json import dumps as json_dumps
from typing import Any, Literal, cast, overload
from urllib.parse import urlparse
from ...Constants import COMMON_SECRET_KEY, FRONTEND_REDIRECT_URL, QUERY_NAMES
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService
from ...core.utils.Encryptor import Encryptor
from ...core.utils.String import concat, generate_random_string
from ...models import Project, ProjectAssignedUser, ProjectInvitation, UserEmail, UserNotification
from ...models.UserNotification import NotificationType
from ...publishers import ProjectInvitationPublisher
from ...tasks.activities import ProjectActivityTask, UserActivityTask
from .EmailService import EmailService
from .NotificationService import NotificationService
from .RoleService import RoleService
from .Types import TProjectParam
from .UserService import UserService


class InvitationRelatedResult:
    def __init__(self):
        self.already_assigned_ids: list[SnowflakeID] = []
        self.already_assigned_users: list[User] = []
        self.already_assigned_user_emails: list[str] = []
        self.already_sent_user_emails: list[str] = []
        self.emails_should_invite: list[str] = []
        self.emails_should_remove: dict[str, tuple[ProjectInvitation, User | None]] = {}
        self.users_by_email: dict[str, User] = {}
        self.user_ids_should_delete: list[SnowflakeID] = []
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
        async with DbSession.use() as db:
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
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectInvitation).where(ProjectInvitation.column("project_id") == project.id)
            )
        invitations = result.all()

        user_service = self._get_service(UserService)

        for invitation in invitations:
            if invitation.email not in emails:
                user, subemail = await user_service.get_by_email(invitation.email)
                invitation_result.emails_should_remove[invitation.email] = (invitation, user)

        for email in emails:
            user, subemail = await user_service.get_by_email(email)
            if user:
                if user.email in invitation_result.emails_should_remove:
                    invitation_result.emails_should_remove.pop(user.email)
            if subemail:
                if subemail.email in invitation_result.emails_should_remove:
                    invitation_result.emails_should_remove.pop(subemail.email)

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
                invitation_result.user_ids_should_delete.append(assigned_user.user_id)
                invitation_result.assigned_ids_should_delete.append(assigned_user.id)

        return invitation_result

    async def invite_emails(
        self,
        user: User,
        project: TProjectParam,
        invitation_result: InvitationRelatedResult,
    ) -> tuple[bool, dict[str, str]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return False

        for email in invitation_result.emails_should_remove:
            invitation, target_user = invitation_result.emails_should_remove[email]
            if target_user:
                await self.__delete_notification(target_user, project, invitation)
            async with DbSession.use() as db:
                await db.delete(invitation)
                await db.commit()

        urls = {}
        email_service = self._get_service(EmailService)
        notification_service = self._get_service(NotificationService)
        for email in invitation_result.emails_should_invite:
            invitation = ProjectInvitation(project_id=project.id, email=email, token=generate_random_string(32))
            async with DbSession.use() as db:
                db.insert(invitation)
                await db.commit()

            preferred_lang = user.preferred_lang
            target_user = invitation_result.users_by_email.get(email)
            if target_user:
                preferred_lang = target_user.preferred_lang
                await notification_service.notify_project_invited(user, target_user, project, invitation)

            token_url = await self.__create_invitation_token_url(invitation)
            await email_service.send_template(
                preferred_lang,
                email,
                "project_invitation",
                {
                    "project_title": project.title,
                    "recipient": target_user.firstname if target_user else "there",
                    "sender": user.get_fullname(),
                    "url": token_url,
                },
            )
            urls[email] = token_url

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

        async with DbSession.use() as db:
            await db.delete(invitation)
            await db.commit()

        async with DbSession.use() as db:
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

        ProjectInvitationPublisher.accepted(project, model)

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

        async with DbSession.use() as db:
            await db.delete(invitation)
            await db.commit()

        UserActivityTask.declined_project_invitation(user, project)

        return True

    async def __create_invitation_token_url(self, invitation: ProjectInvitation) -> str:
        encrypted_token = Encryptor.encrypt(invitation.create_encrypted_token(), COMMON_SECRET_KEY)

        url_chunks = urlparse(FRONTEND_REDIRECT_URL)
        token_url = url_chunks._replace(
            query=concat(
                url_chunks.query,
                "&" if url_chunks.query else "",
                QUERY_NAMES.PROJCT_INVITATION_TOKEN.value,
                "=",
                encrypted_token,
            )
        ).geturl()

        return token_url

    async def __get_invitation_by_token(self, user: User, token: str) -> ProjectInvitation | None:
        invitation_token, invitation_id = ProjectInvitation.validate_token(token) or (None, None)
        if not invitation_token or not invitation_id:
            return None

        async with DbSession.use() as db:
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
            subemail = await self._get_by(UserEmail, "email", invitation.email)
            if not subemail or subemail.user_id != user.id:
                return None

        return invitation

    async def __delete_notification(self, user: User, project: Project, invitation: ProjectInvitation):
        notification_service = self._get_service(NotificationService)
        record_list = json_dumps(
            notification_service.create_record_list([(project, "project"), (invitation, "invitation")])
        )
        async with DbSession.use() as db:
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

        async with DbSession.use() as db:
            await db.delete(notification)
            await db.commit()

        ProjectInvitationPublisher.notification_deleted(user, notification)
