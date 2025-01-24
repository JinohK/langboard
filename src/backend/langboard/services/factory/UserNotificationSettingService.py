from typing import Literal, Self, cast, overload
from sqlmodel.sql.expression import SelectOfScalar
from ...core.db import BaseSqlModel, DbSession, SqlBuilder, User
from ...core.service import BaseService, NotificationPublishModel
from ...models import Card, Project, ProjectColumn, ProjectWiki, UserNotificationUnsubscription
from ...models.UserNotification import NotificationType
from ...models.UserNotificationUnsubscription import NotificationChannel, NotificationScope
from .Types import TCardParam, TColumnParam, TProjectParam, TWikiParam


class UserNotificationSettingService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user_notification_setting"

    def get_unsubscriptions_query_builder(self, user: User):
        class _QueryBuilder:
            def __init__(self, query: SelectOfScalar[UserNotificationUnsubscription]):
                self.__query = query

            def where_channel(self, channel: NotificationChannel):
                return _QueryBuilder(self.__query.where(UserNotificationUnsubscription.column("channel") == channel))

            def where_notification_type(self, notification_type: NotificationType | list[NotificationType]):
                if isinstance(notification_type, list):
                    return _QueryBuilder(
                        self.__query.where(
                            UserNotificationUnsubscription.column("notification_type").in_(notification_type)
                        )
                    )
                return _QueryBuilder(
                    self.__query.where(UserNotificationUnsubscription.column("notification_type") == notification_type)
                )

            @overload
            def where_scope(self, scope: Literal[NotificationScope.All]) -> Self: ...
            @overload
            def where_scope(self, scope: Literal[NotificationScope.Specific], model: BaseSqlModel) -> Self: ...
            def where_scope(self, scope: NotificationScope, model: BaseSqlModel | None = None):
                query = self.__query.where(UserNotificationUnsubscription.scope_type == scope)
                if scope == NotificationScope.Specific and model:
                    query = self.__query.where(
                        (UserNotificationUnsubscription.column("specific_table") == model.__tablename__)
                        & (UserNotificationUnsubscription.column("specific_id") == model.id)
                    )
                return _QueryBuilder(query)

            async def all(self):
                async with DbSession.use() as db:
                    result = await db.exec(self.__query)
                return list(result.all())

            async def first(self):
                async with DbSession.use() as db:
                    result = await db.exec(self.__query)
                return result.first()

        query = SqlBuilder.select.table(UserNotificationUnsubscription).where(
            UserNotificationUnsubscription.column("user_id") == user.id
        )
        return _QueryBuilder(query)

    @overload
    async def subscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: Literal[NotificationScope.All],
    ) -> list[NotificationType]: ...
    @overload
    async def subscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: Literal[NotificationScope.Specific],
        model: BaseSqlModel,
    ) -> list[NotificationType]: ...
    async def subscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: NotificationScope,
        model: BaseSqlModel | None = None,
    ):
        if not isinstance(notification_types, list):
            notification_types = [notification_types]

        for notification_type in [*notification_types]:
            if notification_type in UserNotificationUnsubscription.UNAVAILABLE_TYPES:
                notification_types.remove(notification_type)

        query = self.get_unsubscriptions_query_builder(user)
        query = query.where_channel(channel).where_notification_type(notification_types)
        if scope == NotificationScope.Specific:
            if not model:
                return False
            query = query.where_scope(scope, model)
        else:
            query = query.where_scope(scope)

        unsubscriptions = await query.all()

        for unsubscription in unsubscriptions:
            async with DbSession.use() as db:
                await db.delete(unsubscription)
                await db.commit()

        return notification_types

    @overload
    async def unsubscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: Literal[NotificationScope.All],
    ) -> list[NotificationType]: ...
    @overload
    async def unsubscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: Literal[NotificationScope.Specific],
        model: BaseSqlModel,
    ) -> list[NotificationType]: ...
    async def unsubscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: NotificationScope,
        model: BaseSqlModel | None = None,
    ):
        if not isinstance(notification_types, list):
            notification_types = [notification_types]

        for notification_type in [*notification_types]:
            if notification_type in UserNotificationUnsubscription.UNAVAILABLE_TYPES:
                notification_types.remove(notification_type)

        query = self.get_unsubscriptions_query_builder(user)
        query = query.where_channel(channel).where_notification_type(notification_types)
        if scope == NotificationScope.Specific:
            if not model:
                return False
            query = query.where_scope(scope, model)
        else:
            query = query.where_scope(scope)

        unsubscriptions = await query.all()
        already_unsubscribed_types = [unsubscription.notification_type for unsubscription in unsubscriptions]

        for notification_type in notification_types:
            if notification_type in already_unsubscribed_types:
                continue

            unsubscription = UserNotificationUnsubscription(
                user_id=user.id,
                channel=channel,
                notification_type=notification_type,
                scope_type=scope,
                specific_table=model.__tablename__ if model else None,
                specific_id=model.id if model else None,
            )

            async with DbSession.use() as db:
                db.insert(unsubscription)
                await db.commit()

        return notification_types

    async def has_unsubscription(self, model: NotificationPublishModel, channel: NotificationChannel) -> bool:
        query = (
            self.get_unsubscriptions_query_builder(model.target_user)
            .where_channel(channel)
            .where_notification_type(model.notification_type)
        )
        unsubscription = await query.where_scope(NotificationScope.All).first()
        if unsubscription:
            return True

        if not model.scope_models:
            return False

        for table_name, record_id in model.scope_models:
            scope_model = await self.get_record_by_table_name_with_id(table_name, record_id)
            if not scope_model:
                continue

            unsubscription = await query.where_scope(NotificationScope.Specific, scope_model).first()
            if unsubscription:
                return True

        return False

    async def toggle_all(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [notification_type for notification_type in NotificationType],
            "scope": NotificationScope.All,
        }

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    async def toggle_type(
        self, user: User, channel: NotificationChannel, notification_type: NotificationType, is_unsubscribed: bool
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": notification_type,
            "scope": NotificationScope.All,
        }

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    @overload
    async def toggle_project(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]: ...
    @overload
    async def toggle_project(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool, project: TProjectParam
    ) -> list[NotificationType]: ...
    async def toggle_project(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool, project: TProjectParam | None = None
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [
                NotificationType.AssignedToCard,
                NotificationType.MentionedAtCard,
                NotificationType.MentionedAtComment,
                NotificationType.MentionedAtWiki,
                NotificationType.NotifiedFromChecklist,
                NotificationType.ReactedToComment,
            ],
        }

        if project:
            project = cast(Project, await self._get_by_param(Project, project))
            if not project:
                return []
            params["scope"] = NotificationScope.Specific
            params["model"] = project
        else:
            params["scope"] = NotificationScope.All

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    @overload
    async def toggle_column(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]: ...
    @overload
    async def toggle_column(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam,
        column: TColumnParam,
    ) -> list[NotificationType]: ...
    async def toggle_column(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam | None = None,
        column: TColumnParam | None = None,
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [
                NotificationType.AssignedToCard,
                NotificationType.MentionedAtCard,
                NotificationType.MentionedAtComment,
                NotificationType.NotifiedFromChecklist,
                NotificationType.ReactedToComment,
            ],
        }

        if project and column:
            project = cast(Project, await self._get_by_param(Project, project))
            column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, column))
            if not project or not column or column.project_id != project.id:
                return []
            params["scope"] = NotificationScope.Specific
            params["model"] = column
        else:
            params["scope"] = NotificationScope.All

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    @overload
    async def toggle_card(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]: ...
    @overload
    async def toggle_card(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool, project: TProjectParam, card: TCardParam
    ) -> list[NotificationType]: ...
    async def toggle_card(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam | None = None,
        card: TCardParam | None = None,
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [
                NotificationType.AssignedToCard,
                NotificationType.MentionedAtCard,
                NotificationType.MentionedAtComment,
                NotificationType.NotifiedFromChecklist,
                NotificationType.ReactedToComment,
            ],
        }

        if project and card:
            project = cast(Project, await self._get_by_param(Project, project))
            card = cast(Card, await self._get_by_param(Card, card))
            if not project or not card or card.project_id != project.id:
                return []
            params["scope"] = NotificationScope.Specific
            params["model"] = card
        else:
            params["scope"] = NotificationScope.All

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    @overload
    async def toggle_wiki(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]: ...
    @overload
    async def toggle_wiki(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool, project: TProjectParam, wiki: TWikiParam
    ) -> list[NotificationType]: ...
    async def toggle_wiki(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam | None = None,
        wiki: TWikiParam | None = None,
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [NotificationType.MentionedAtWiki],
        }

        if project and wiki:
            project = cast(Project, await self._get_by_param(Project, project))
            wiki = cast(ProjectWiki, await self._get_by_param(ProjectWiki, wiki))
            if not project or not wiki or wiki.project_id != project.id:
                return []
            params["scope"] = NotificationScope.Specific
            params["model"] = wiki
        else:
            params["scope"] = NotificationScope.All

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)
