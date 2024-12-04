from typing import cast
from ...models import User, UserActivity, UserGroup, UserGroupAssignedUser
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService
from .RevertService import RevertService, RevertType


class UserGroupService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "group"

    async def get_by_id(self, group_id: int) -> UserGroup | None:
        return await self._get_by(UserGroup, "id", group_id)

    @ActivityService.activity_method(UserActivity, ActivityService.ACTIVITY_TYPES.UserGroupAssignedUser)
    async def create(self, user: User, name: str, user_ids: list[int] | None = None) -> tuple[ActivityResult, str]:
        user_ids = user_ids or []
        user_group = UserGroup(user_id=cast(int, user.id), name=name)

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(revert_service.create_record_model(user_group, RevertType.Delete))

        if not user_ids.count(cast(int, user.id)):
            user_ids.append(cast(int, user.id))

        if user_ids:
            assigned_users = []
            raw_users = await self._get_all_by(User, "id", user_ids)

            for user in raw_users:
                assigned_users.append(
                    UserGroupAssignedUser(group_id=cast(int, user_group.id), user_id=cast(int, user.id))
                )

            await revert_service.record(
                *[
                    revert_service.create_record_model(assigned_user, RevertType.Delete)
                    for assigned_user in assigned_users
                ],
                revert_key=revert_key,
            )

        activity_result = ActivityResult(
            user_or_bot=user,
            model=user,
            shared={"user_ids": user_ids},
            new={"group_name": name},
            revert_key=revert_key,
        )

        return activity_result, revert_key

    @ActivityService.activity_method(UserActivity, ActivityService.ACTIVITY_TYPES.UserGroupAssignedUser)
    async def assign_users(
        self, user: User, user_group_id: int, target_user_ids: list[int]
    ) -> tuple[ActivityResult, bool] | None:
        user_group = await self.get_by_id(user_group_id)
        target_users = await self._get_all_by(User, "id", target_user_ids)
        if not user_group or not target_users or user_group.user_id != user.id:
            return None

        sql_query = (
            self._db.query("select")
            .tables(User, UserGroupAssignedUser)
            .join(UserGroupAssignedUser, UserGroupAssignedUser.column("user_id") == User.column("id"))
            .where(UserGroupAssignedUser.group_id == user_group_id)
        )
        sql_query = self._where_in(sql_query, User.column("id"), target_user_ids)
        result = await self._db.exec(sql_query)
        results = result.all()

        assigned_users = []
        user_ids = []
        for target_user, assigned in results:
            if assigned:
                continue
            assigned_users.append(UserGroupAssignedUser(group_id=user_group_id, user_id=cast(int, target_user.id)))
            user_ids.append(target_user.id)

        if not assigned_users:
            return None

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            *[revert_service.create_record_model(assigned_user, RevertType.Delete) for assigned_user in assigned_users]
        )

        activity_result = ActivityResult(
            user_or_bot=user,
            model=user,
            shared={"group_name": user_group.name, "user_ids": user_ids},
            new={},
            revert_key=revert_key,
        )

        return activity_result, True
