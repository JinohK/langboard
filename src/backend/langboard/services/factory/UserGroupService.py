from typing import cast
from ...core.db import User
from ...core.service import BaseService
from ...models import UserGroup, UserGroupAssignedEmail
from .RevertService import RevertService, RevertType
from .Types import TUserGroupParam


class UserGroupService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user_group"

    async def get_by_id(self, group_id: int) -> UserGroup | None:
        return await self._get_by(UserGroup, "id", group_id)

    async def create(self, user: User, name: str, emails: list[str] | None = None) -> tuple[UserGroup, str]:
        max_order = await self._get_max_order(UserGroup, "user_id", user.id)
        emails = emails or []
        user_group = UserGroup(user_id=user.id, name=name, order=max_order + 1)

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(revert_service.create_record_model(user_group, RevertType.Delete))

        if emails:
            assigned_emails = []

            for email in set(emails):
                assigned_emails.append(UserGroupAssignedEmail(group_id=user_group.id, email=email))

            await revert_service.record(
                *[
                    revert_service.create_record_model(assigned_email, RevertType.Delete)
                    for assigned_email in assigned_emails
                ],
                revert_key=revert_key,
            )

        return user_group, revert_key

    async def update_assigned_emails(self, user: User, user_group: TUserGroupParam, emails: list[str]) -> str | None:
        user_group = cast(UserGroup, await self._get_by_param(UserGroup, user_group))
        if not user_group or user_group.user_id != user.id:
            return None

        prev_assigned_emails = await self._get_all_by(UserGroupAssignedEmail, "group_id", user_group.id)
        await self._db.exec(
            self._db.query("delete")
            .table(UserGroupAssignedEmail)
            .where(UserGroupAssignedEmail.column("group_id") == user_group.id)
        )

        assigned_emails = []
        for email in set(emails):
            assigned_emails.append(UserGroupAssignedEmail(group_id=user_group.id, email=email))

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            *[
                *[
                    revert_service.create_record_model(assigned_email, RevertType.Insert)
                    for assigned_email in prev_assigned_emails
                ],
                *[
                    revert_service.create_record_model(assigned_email, RevertType.Delete)
                    for assigned_email in assigned_emails
                ],
            ]
        )

        return revert_key
