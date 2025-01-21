from typing import Any, Literal, cast, overload
from ...core.db import DbSession, SqlBuilder, User
from ...core.service import BaseService
from ...models import UserEmail, UserGroup, UserGroupAssignedEmail
from .Types import TUserGroupParam


class UserGroupService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user_group"

    @overload
    async def get_all_by_user(
        self, user: User, as_api: Literal[False]
    ) -> list[tuple[UserGroup, list[tuple[UserGroupAssignedEmail, User | None]]]]: ...
    @overload
    async def get_all_by_user(self, user: User, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_user(
        self, user: User, as_api: bool
    ) -> list[tuple[UserGroup, list[tuple[UserGroupAssignedEmail, User | None]]]] | list[dict[str, Any]]:
        if not user.id:
            return []

        raw_groups = await self._get_all_by(UserGroup, "user_id", user.id)
        groups = []
        for group in raw_groups:
            records = await self.get_user_emails_by_group(group, as_api=cast(Literal[False], as_api))
            if not as_api:
                groups.append((group, records))
                continue
            api_group = group.api_response()
            api_group["users"] = records
            groups.append(api_group)
        return groups

    @overload
    async def get_user_emails_by_group(
        self, user_group: TUserGroupParam, as_api: Literal[False]
    ) -> list[tuple[UserGroupAssignedEmail, User | None]]: ...
    @overload
    async def get_user_emails_by_group(
        self, user_group: TUserGroupParam, as_api: Literal[True]
    ) -> list[dict[str, Any]]: ...
    async def get_user_emails_by_group(
        self, user_group: TUserGroupParam, as_api: bool
    ) -> list[tuple[UserGroupAssignedEmail, User | None]] | list[dict[str, Any]]:
        user_group = cast(UserGroup, await self._get_by_param(UserGroup, user_group))
        if not user_group:
            return []

        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.tables(UserGroupAssignedEmail, User)
                .outerjoin(
                    UserEmail,
                    (UserEmail.column("email") == UserGroupAssignedEmail.column("email"))
                    & (UserEmail.column("deleted_at") == None),  # noqa
                )
                .outerjoin(
                    User,
                    (User.column("email") == UserGroupAssignedEmail.column("email"))
                    | (User.column("id") == UserEmail.column("user_id")),
                )
                .where(UserGroupAssignedEmail.column("group_id") == user_group.id)
                .order_by(UserGroupAssignedEmail.column("email"), UserGroupAssignedEmail.column("id"))
                .group_by(
                    UserGroupAssignedEmail.column("email"), UserGroupAssignedEmail.column("id"), User.column("id")
                )
            )
        records = result.all()
        if not as_api:
            return list(records)

        users = []
        for assigned_email, existing_user in records:
            if existing_user:
                users.append(existing_user.api_response())
            else:
                users.append(User.create_email_user_api_response(assigned_email.id, assigned_email.email))
        return users

    async def create(self, user: User, name: str, emails: list[str] | None = None) -> UserGroup:
        max_order = await self._get_max_order(UserGroup, "user_id", user.id)
        emails = emails or []
        user_group = UserGroup(user_id=user.id, name=name, order=max_order + 1)

        async with DbSession.use_db() as db:
            db.insert(user_group)
            await db.commit()

        if emails:
            async with DbSession.use_db() as db:
                for email in set(emails):
                    assigned_email = UserGroupAssignedEmail(group_id=user_group.id, email=email)
                    db.insert(assigned_email)
                await db.commit()

        return user_group

    async def change_name(self, user: User, user_group: TUserGroupParam, name: str) -> bool:
        user_group = cast(UserGroup, await self._get_by_param(UserGroup, user_group))
        if not user_group or user_group.user_id != user.id:
            return False

        user_group.name = name

        async with DbSession.use_db() as db:
            await db.update(user_group)
            await db.commit()
        return True

    async def update_assigned_emails(self, user: User, user_group: TUserGroupParam, emails: list[str]) -> bool:
        user_group = cast(UserGroup, await self._get_by_param(UserGroup, user_group))
        if not user_group or user_group.user_id != user.id:
            return False

        async with DbSession.use_db() as db:
            await db.exec(
                SqlBuilder.delete.table(UserGroupAssignedEmail).where(
                    UserGroupAssignedEmail.column("group_id") == user_group.id
                )
            )
            await db.commit()

        app_users = await self._get_all_by(User, "email", emails)
        app_user_subemails = await self._get_all_by(UserEmail, "email", emails)
        unique_app_user_emails_map = {}
        appended_emails = []
        for app_user in app_users:
            appended_emails.append(app_user.email)
            unique_app_user_emails_map[app_user.id] = app_user.email
        for app_user_subemail in app_user_subemails:
            appended_emails.append(app_user_subemail.email)
            if app_user_subemail.user_id in unique_app_user_emails_map:
                continue
            unique_app_user_emails_map[app_user_subemail.user_id] = app_user_subemail.email

        unique_app_user_emails = set(unique_app_user_emails_map.values())
        none_user_emails = [email for email in emails if email not in appended_emails]
        all_emails = unique_app_user_emails.union(none_user_emails)

        async with DbSession.use_db() as db:
            for email in all_emails:
                assigned_email = UserGroupAssignedEmail(group_id=user_group.id, email=email)
                db.insert(assigned_email)
            await db.commit()

        return True

    async def delete(self, user: User, user_group: TUserGroupParam) -> bool:
        user_group = cast(UserGroup, await self._get_by_param(UserGroup, user_group))
        if not user_group or user_group.user_id != user.id:
            return False

        async with DbSession.use_db() as db:
            await db.exec(
                SqlBuilder.delete.table(UserGroupAssignedEmail).where(
                    UserGroupAssignedEmail.column("group_id") == user_group.id
                )
            )
            await db.commit()

        async with DbSession.use_db() as db:
            await db.delete(user_group)
            await db.commit()

        return True
