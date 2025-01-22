from datetime import timedelta
from typing import Any, TypeVar, cast
from ...core.ai import Bot
from ...core.db import DbSession, EditorContentModel, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService
from ...core.utils.DateTime import now
from ...core.utils.EditorContentParser import change_date_element, find_mentioned
from ...models import Card, CardComment, Checklist, Project, ProjectInvitation, ProjectWiki, UserNotification
from ...models.UserNotification import NotificationType
from ...publishers import NotificationPublisher
from .Types import TNotificationParam, TUserOrBot, TUserParam


_TModel = TypeVar(
    "_TModel", bound=User | Bot | Project | ProjectInvitation | ProjectWiki | Card | CardComment | Checklist
)


class NotificationService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "notification"

    async def get_list(self, user: User) -> list[dict[str, Any]]:
        sql_query = SqlBuilder.select.table(UserNotification).where(
            (UserNotification.column("receiver_id") == user.id)
            & (
                (UserNotification.column("read_at") == None)  # noqa
                | (UserNotification.column("read_at") >= now() - timedelta(days=3))
            )
        )

        sql_query = sql_query.order_by(
            UserNotification.column("created_at").desc(), UserNotification.column("id").desc()
        )
        sql_query = sql_query.group_by(UserNotification.column("id"), UserNotification.column("created_at"))
        async with DbSession.use_db() as db:
            result = await db.exec(sql_query)
        raw_notifications = result.all()

        notifications = []
        for notification in raw_notifications:
            api_notification = await self.convert_to_api_response(notification)
            notifications.append(api_notification)
        return notifications

    async def convert_to_api_response(self, notification: UserNotification) -> dict[str, Any]:
        api_notification = notification.api_response()
        records: dict[str, Any] = {}
        for table_name, record_id, key_name in notification.record_list:
            model = self._get_model_by_table_name(table_name)
            if not model:
                continue
            record = await self._get_by(model, "id", record_id)
            if not record:
                continue

            records[key_name] = record.notification_data()
        api_notification["records"] = records
        if notification.notifier_type == "user":
            notifier = cast(User, await self._get_by(User, "id", notification.notifier_id, with_deleted=True))
            api_notification["notifier_user"] = notifier.api_response()
        else:
            notifier = cast(Bot, await self._get_by(Bot, "id", notification.notifier_id, with_deleted=True))
            api_notification["notifier_bot"] = notifier.api_response()
        return api_notification

    async def read(self, user: User, notification: TNotificationParam) -> bool:
        notification = cast(UserNotification, await self._get_by_param(UserNotification, notification))
        if not notification or notification.receiver_id != user.id:
            return False

        notification.read_at = now()
        async with DbSession.use_db() as db:
            await db.update(notification)
            await db.commit()

        return True

    async def read_all(self, user: User):
        sql_query = (
            SqlBuilder.update.table(UserNotification)
            .values({UserNotification.column("read_at"): now()})
            .where(
                (UserNotification.column("receiver_id") == user.id) & (UserNotification.column("read_at") == None)  # noqa
            )
        )
        async with DbSession.use_db() as db:
            await db.exec(sql_query)
            await db.commit()

    async def delete(self, user: User, notification: TNotificationParam) -> bool:
        notification = cast(UserNotification, await self._get_by_param(UserNotification, notification))
        if not notification or notification.receiver_id != user.id:
            return False

        async with DbSession.use_db() as db:
            await db.delete(notification)
            await db.commit()

        return True

    async def delete_all(self, user: User):
        sql_query = SqlBuilder.delete.table(UserNotification).where(UserNotification.column("receiver_id") == user.id)
        async with DbSession.use_db() as db:
            await db.exec(sql_query)
            await db.commit()

    # from here, notifiable types are added
    async def notify_project_invited(
        self, notifier: TUserOrBot, target_user: TUserParam, project: Project, project_invitation: ProjectInvitation
    ):
        await self.__notify(
            notifier,
            target_user,
            NotificationType.ProjectInvited,
            [(project, "project"), (project_invitation, "invitation")],
        )

    async def notify_mentioned_at_card(self, notifier: TUserOrBot, project: Project, card: Card):
        await self.__notify_mentioned(
            notifier, card.description, NotificationType.MentionedAtCard, [(project, "project"), (card, "card")]
        )

    async def notify_mentioned_at_comment(
        self, notifier: TUserOrBot, project: Project, card: Card, comment: CardComment
    ):
        await self.__notify_mentioned(
            notifier,
            comment.content,
            NotificationType.MentionedAtComment,
            [(project, "project"), (card, "card"), (comment, "comment")],
        )

    async def notify_mentioned_at_wiki(self, notifier: TUserOrBot, project: Project, wiki: ProjectWiki):
        await self.__notify_mentioned(
            notifier, wiki.content, NotificationType.MentionedAtWiki, [(project, "project"), (wiki, "wiki")]
        )

    async def notify_assigned_to_card(
        self, notifier: TUserOrBot, target_user: TUserParam, project: Project, card: Card
    ):
        await self.__notify(
            notifier, target_user, NotificationType.AssignedToCard, [(project, "project"), (card, "card")]
        )

    async def notify_reacted_to_comment(
        self,
        notifier: TUserOrBot,
        project: Project,
        card: Card,
        comment: CardComment,
        reaction_type: str,
    ):
        first_line = ""
        if comment.content:
            content = change_date_element(comment.content).strip().splitlines()
            first_line = content.pop() if content else ""
        await self.__notify(
            notifier,
            cast(int, comment.user_id),
            NotificationType.ReactedToComment,
            [(project, "project"), (card, "card"), (comment, "comment")],
            {"reaction_type": reaction_type, "line": first_line},
        )

    async def notify_checklist(
        self, notifier: TUserOrBot, target_user: TUserParam, project: Project, card: Card, checklist: Checklist
    ):
        await self.__notify(
            notifier,
            target_user,
            NotificationType.NotifiedFromChecklist,
            [(project, "project"), (card, "card"), (checklist, "checklist")],
        )

    def create_record_list(self, record_list: list[tuple[_TModel, str]]) -> list[tuple[str, SnowflakeID, str]]:
        return [(type(record).__tablename__, record.id, key_name) for record, key_name in record_list]

    # to here, notifiable types are added

    async def __notify_mentioned(
        self,
        notifier: TUserOrBot,
        editor: EditorContentModel | None,
        notification_type: NotificationType,
        record_with_key_names: list[tuple[_TModel, str]],
    ):
        if not editor or not editor.content:
            return
        user_or_bot_uids, mentioned_lines = find_mentioned(editor)
        for user_or_bot_uid in user_or_bot_uids:
            await self.__notify(
                notifier,
                user_or_bot_uid,
                notification_type,
                record_with_key_names,
                {"line": mentioned_lines[user_or_bot_uid]},
            )

    async def __notify(
        self,
        notifier: TUserOrBot,
        target_user_or_bot: TUserParam,
        notification_type: NotificationType,
        record_with_key_names: list[tuple[_TModel, str]],
        message_vars: dict[str, Any] = {},
    ) -> UserNotification | None:
        target_user_or_bot = cast(User, await self._get_by_param(User, target_user_or_bot))
        if not target_user_or_bot or target_user_or_bot.id == notifier.id:
            return None

        notification = UserNotification(
            notifier_type="user" if isinstance(notifier, User) else "bot",
            notifier_id=notifier.id,
            receiver_id=target_user_or_bot.id,
            notification_type=notification_type,
            message_vars=message_vars,
            record_list=self.create_record_list(record_with_key_names),
        )
        async with DbSession.use_db() as db:
            db.insert(notification)
            await db.commit()

        api_notification = await self.convert_to_api_response(notification)
        NotificationPublisher.notified(target_user_or_bot, api_notification)

        return notification
