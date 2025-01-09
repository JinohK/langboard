from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, cast
from urllib.parse import urlparse
from ...Constants import COMMON_SECRET_KEY
from ...core.caching import Cache
from ...core.db import User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...core.utils.Encryptor import Encryptor
from ...core.utils.String import concat, generate_random_string
from ...models import Project, ProjectAssignedUser, ProjectInvitation, UserEmail
from .EmailService import EmailService
from .RoleService import RoleService
from .Types import TProjectParam
from .UserService import UserService


class ProjectInvitationService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_invitation"

    async def get_invited_users(self, project: TProjectParam) -> list[tuple[ProjectInvitation, User | None]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .tables(ProjectInvitation, User)
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
        return list(result.all())

    async def invite_emails(
        self, user: User, project: TProjectParam, lang: str, url: str, token_query_name: str, emails: list[str]
    ) -> tuple[bool, list[dict[str, Any]], dict[str, str]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return False, {}

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

        user_service = self._get_service(UserService)
        api_invited_users: list[dict[str, Any]] = []
        emails_should_invite: list[str | tuple[User, str | list[str]]] = [*emails]
        added_user_ids = []
        for target_user, target_subemail, already_assigned in records:
            if target_user.id in added_user_ids:
                continue

            if already_assigned:
                target_email = target_subemail.email if target_subemail else target_user.email
                if target_email in emails_should_invite:
                    api_invited_users.append(target_user.api_response())
                    emails_should_invite.remove(target_email)
                continue

            added_user_ids.append(target_user.id)
            subemails = await self._get_all_by(UserEmail, "user_id", target_user.id)
            if target_user.email in emails_should_invite:
                emails_should_invite.remove(target_user.email)

            if subemails:
                for subemail in subemails:
                    if subemail.email in emails_should_invite:
                        emails_should_invite.remove(subemail.email)
                emails_should_invite.append(
                    (target_user, [target_user.email, *[subemail.email for subemail in subemails]])
                )
            else:
                emails_should_invite.append((target_user, target_user.email))
        added_user_ids = None

        already_sents = await self._get_all_by(ProjectInvitation, "project_id", project.id)
        for already_sent in already_sents:
            is_existed = False
            for email_should_invite in emails_should_invite:
                if isinstance(email_should_invite, tuple):
                    _, email_or_list = email_should_invite
                    email_or_list = email_or_list if isinstance(email_or_list, list) else [email_or_list]
                    if already_sent.email in email_or_list:
                        is_existed = True
                        emails_should_invite.remove(email_should_invite)
                else:
                    if already_sent.email == email_should_invite:
                        is_existed = True
                        emails_should_invite.remove(email_should_invite)
            if is_existed:
                target_user, _ = await user_service.get_by_email(already_sent.email)
                if target_user:
                    api_invited_users.append(target_user.api_response())
                else:
                    api_invited_users.append(User.create_email_user_api_response(already_sent.id, already_sent.email))
                continue
            await Cache.delete(f"project-invitation:{already_sent.id}")
            await self._db.delete(already_sent)
        await self._db.commit()

        urls = {}
        for email_should_invite in emails_should_invite:
            target_user, email_or_list = (
                email_should_invite if isinstance(email_should_invite, tuple) else (None, email_should_invite)
            )
            primary_email = email_or_list[0] if isinstance(email_or_list, list) else email_or_list
            invitation = ProjectInvitation(project_id=project.id, email=primary_email)
            self._db.insert(invitation)
            await self._db.commit()

            token_url = await self.__create_invitation_token_url(invitation, url, token_query_name)
            email_service = self._get_service(EmailService)
            await email_service.send_template(lang, email_or_list, "project_invitation", {"url": token_url})

            if target_user:
                api_invited_users.append(target_user.api_response())
            else:
                target_user, _ = await user_service.get_by_email(primary_email)
                if target_user:
                    api_invited_users.append(target_user.api_response())
                else:
                    api_invited_users.append(User.create_email_user_api_response(invitation.id, primary_email))

            urls[primary_email] = token_url

        return True, api_invited_users, urls

    async def accept(
        self, user: User, token: str
    ) -> SocketModelIdBaseResult[tuple[Project, list[User], list[tuple[ProjectInvitation, User | None]]]] | None:
        try:
            token_info = json_loads(Encryptor.decrypt(token, COMMON_SECRET_KEY))
            if not token_info or "token" not in token_info or "invitaiton_id" not in token_info:
                return None
            token_info["invitaiton_id"] = int(token_info["invitaiton_id"])
        except Exception:
            return None

        cache_key = f"project-invitation:{token_info["invitaiton_id"]}"
        cache_token_data = await Cache.get(cache_key)
        if (
            not cache_token_data
            or cache_token_data["token"] != token_info["token"]
            or cache_token_data["invitaiton_id"] != token_info["invitaiton_id"]
        ):
            return None

        invitation = await self._get_by(ProjectInvitation, "id", token_info["invitaiton_id"])
        if not invitation:
            return None

        project = await self._get_by_param(Project, invitation.project_id)
        if not project:
            return None

        if user.email != invitation.email:
            subemails = [subemail.email for subemail in await self._get_all_by(UserEmail, "user_id", user.id)]
            if invitation.email not in subemails:
                return None

        assign_user = ProjectAssignedUser(project_id=invitation.project_id, user_id=user.id)

        await self._db.delete(invitation)
        self._db.insert(assign_user)

        role_service = self._get_service(RoleService)
        await role_service.project.grant_default(user_id=user.id, project_id=invitation.project_id)

        await self._db.commit()

        await Cache.delete(cache_key)

        result = await self._db.exec(
            self._db.query("select")
            .table(User)
            .join(ProjectAssignedUser, (User.column("id") == ProjectAssignedUser.column("user_id")))
            .where(ProjectAssignedUser.column("project_id") == invitation.project_id)
        )

        updated_users = list(result.all())
        updated_invited_users = await self.get_invited_users(invitation.project_id)

        model = {
            "assigned_members": [user.api_response() for user in updated_users],
            "invited_members": [],
            "invitation_uid": invitation.get_uid(),
        }

        for invitation, invited_user in updated_invited_users:
            if invited_user:
                model["invited_members"].append(invited_user.api_response())
            else:
                model["invited_members"].append(User.create_email_user_api_response(invitation.id, invitation.email))

        model_id = await SocketModelIdService.create_model_id(model)

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:assigned-users:updated:{project.get_uid()}",
            data_keys=list(model.keys()),
        )

        return SocketModelIdBaseResult(model_id, (project, updated_users, updated_invited_users), publish_model)

    async def __create_invitation_token_url(
        self, invitation: ProjectInvitation, url: str, token_query_name: str
    ) -> str:
        token = generate_random_string(32)
        token_expire_hours = 24
        token_data = json_dumps({"token": token, "invitaiton_id": invitation.id})
        encrypted_token = Encryptor.encrypt(token_data, COMMON_SECRET_KEY)

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

        cache_token_Data = {"token": token, "invitaiton_id": invitation.id}

        await Cache.set(f"project-invitation:{invitation.id}", cache_token_Data, 60 * 60 * token_expire_hours)

        return token_url
