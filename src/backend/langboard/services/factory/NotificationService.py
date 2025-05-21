from datetime import timedelta
from typing import Any, Literal, TypeVar, cast, overload
from urllib.parse import urlparse
from ...Constants import FRONTEND_REDIRECT_URL, QUERY_NAMES
from ...core.ai import Bot
from ...core.db import BaseSqlModel, DbSession, EditorContentModel, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService, NotificationPublishModel, NotificationPublishService
from ...core.utils.DateTime import now
from ...core.utils.EditorContentParser import change_date_element, find_mentioned
from ...core.utils.String import concat
from ...models import (
    Card,
    CardComment,
    Checklist,
    Project,
    ProjectColumn,
    ProjectInvitation,
    ProjectWiki,
    UserNotification,
)
from ...models.UserNotification import NotificationType
from ...resources.locales.EmailTemplateNames import TEmailTemplateName
from ...tasks.bot import BotDefaultTask
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
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.table(UserNotification)
                .where(
                    (UserNotification.column("receiver_id") == user.id)
                    & (
                        (UserNotification.column("read_at") == None)  # noqa
                        | (UserNotification.column("read_at") >= now() - timedelta(days=3))
                    )
                )
                .order_by(UserNotification.column("created_at").desc(), UserNotification.column("id").desc())
            )
        raw_notifications = result.all()

        cached_dict = {}
        table_id_dict: dict[str, tuple[str, set[int]]] = {}
        for notification in raw_notifications:
            for table_name, record_id, key_name in notification.record_list:
                if table_name not in table_id_dict:
                    table_id_dict[table_name] = key_name, set()
                table_id_dict[table_name][1].add(record_id)

        for table_name, (key_name, record_ids) in table_id_dict.items():
            results = await self.get_records_by_table_name_with_ids(table_name, list(record_ids))
            if not results:
                continue
            for record in results:
                cache_key = f"{table_name}_{record.id}"
                if cache_key in cached_dict:
                    continue
                cached_dict[cache_key] = record.notification_data()

        notifications = []
        notification_ids_should_delete = []
        for notification in raw_notifications:
            notification_records = {}
            should_continue = True
            for table_name, record_id, key_name in notification.record_list:
                record = cached_dict.get(f"{table_name}_{record_id}")
                if not record:
                    should_continue = False
                    break
                notification_records[key_name] = record
            if not should_continue:
                notification_ids_should_delete.append(notification.id)
                continue

            notifier_cache_key = f"{notification.notifier_type}_{notification.notifier_id}"
            if notifier_cache_key in cached_dict:
                notifier_key, notifier = cached_dict[notifier_cache_key]
            else:
                notifier_key, notifier = await self.get_notifier(notification, as_api=True)
                cached_dict[notifier_cache_key] = notifier_key, notifier

            notifications.append(
                {
                    **notification.api_response(),
                    notifier_key: notifier,
                    "records": notification_records,
                }
            )

        if notification_ids_should_delete:
            async with DbSession.use(readonly=False) as db:
                await db.exec(
                    SqlBuilder.delete.table(UserNotification).where(
                        UserNotification.column("id").in_(notification_ids_should_delete)
                    )
                )

        return notifications

    async def convert_to_api_response(self, notification: UserNotification) -> dict[str, Any]:
        api_notification = notification.api_response()
        records: dict[str, Any] = {}
        table_id_dict: dict[str, tuple[str, list[int]]] = {}
        for table_name, record_id, key_name in notification.record_list:
            if table_name not in table_id_dict:
                table_id_dict[table_name] = key_name, []
            table_id_dict[table_name][1].append(record_id)

        for table_name, (key_name, record_ids) in table_id_dict.items():
            results = await self.get_records_by_table_name_with_ids(table_name, record_ids)
            if not results:
                continue
            for record in results:
                if key_name not in records:
                    records[key_name] = {}
                records[key_name] = record.notification_data()

        api_notification["records"] = records
        notifier_key, notifier = await self.get_notifier(notification, as_api=True)
        api_notification[notifier_key] = notifier
        return api_notification

    @overload
    async def get_notifier(self, notification: UserNotification, as_api: Literal[False]) -> User | Bot: ...
    @overload
    async def get_notifier(
        self, notification: UserNotification, as_api: Literal[True]
    ) -> tuple[str, dict[str, Any]]: ...
    async def get_notifier(
        self, notification: UserNotification, as_api: bool
    ) -> User | Bot | tuple[str, dict[str, Any]]:
        if notification.notifier_type == "user":
            notifier = cast(User, await self._get_by(User, "id", notification.notifier_id, with_deleted=True))
        else:
            notifier = cast(Bot, await self._get_by(Bot, "id", notification.notifier_id, with_deleted=True))

        if not as_api:
            return notifier

        if notification.notifier_type == "user":
            return "notifier_user", notifier.api_response()
        return "notifier_bot", notifier.api_response()

    async def read(self, user: User, notification: TNotificationParam) -> bool:
        notification = cast(UserNotification, await self._get_by_param(UserNotification, notification))
        if not notification or notification.receiver_id != user.id:
            return False

        notification.read_at = now()
        async with DbSession.use(readonly=False) as db:
            await db.update(notification)

        return True

    async def read_all(self, user: User):
        sql_query = (
            SqlBuilder.update.table(UserNotification)
            .values({UserNotification.column("read_at"): now()})
            .where(
                (UserNotification.column("receiver_id") == user.id) & (UserNotification.column("read_at") == None)  # noqa
            )
        )
        async with DbSession.use(readonly=False) as db:
            await db.exec(sql_query)

    async def delete(self, user: User, notification: TNotificationParam) -> bool:
        notification = cast(UserNotification, await self._get_by_param(UserNotification, notification))
        if not notification or notification.receiver_id != user.id:
            return False

        async with DbSession.use(readonly=False) as db:
            await db.delete(notification)

        return True

    async def delete_all(self, user: User):
        sql_query = SqlBuilder.delete.table(UserNotification).where(UserNotification.column("receiver_id") == user.id)
        async with DbSession.use(readonly=False) as db:
            await db.exec(sql_query)

    # from here, notifiable types are added
    async def notify_project_invited(
        self, notifier: TUserOrBot, target_user: TUserParam, project: Project, project_invitation: ProjectInvitation
    ):
        await self.__notify(
            notifier,
            target_user,
            NotificationType.ProjectInvited,
            None,
            [(project, "project"), (project_invitation, "invitation")],
        )

    async def notify_mentioned_in_card(self, notifier: TUserOrBot, project: Project, card: Card):
        column = await self.__get_column_by_card(card)
        await self.__notify_mentioned(
            notifier,
            card.description,
            NotificationType.MentionedInCard,
            [project, column, card],
            [(project, "project"), (card, "card")],
            "mentioned_in_card",
            {"url": self.__create_redirect_url(project, card)},
        )

    async def notify_mentioned_in_comment(
        self, notifier: TUserOrBot, project: Project, card: Card, comment: CardComment
    ):
        column = await self.__get_column_by_card(card)
        await self.__notify_mentioned(
            notifier,
            comment.content,
            NotificationType.MentionedInComment,
            [project, column, card],
            [(project, "project"), (card, "card"), (comment, "comment")],
            "mentioned_in_comment",
            {"url": self.__create_redirect_url(project, card)},
        )

    async def notify_mentioned_in_wiki(self, notifier: TUserOrBot, project: Project, wiki: ProjectWiki):
        await self.__notify_mentioned(
            notifier,
            wiki.content,
            NotificationType.MentionedInWiki,
            [project, wiki],
            [(project, "project"), (wiki, "wiki")],
            "mentioned_in_wiki",
            {"url": self.__create_redirect_url(project, wiki)},
        )

    async def notify_assigned_to_card(
        self, notifier: TUserOrBot, target_user: TUserParam, project: Project, card: Card
    ):
        column = await self.__get_column_by_card(card)
        await self.__notify(
            notifier,
            target_user,
            NotificationType.AssignedToCard,
            [project, column, card],
            [(project, "project"), (card, "card")],
            {},
            "assigned_to_card",
            {"url": self.__create_redirect_url(project, card)},
        )

    async def notify_reacted_to_comment(
        self,
        notifier: TUserOrBot,
        project: Project,
        card: Card,
        comment: CardComment,
        reaction_type: str,
    ):
        column = await self.__get_column_by_card(card)
        first_line = ""
        if comment.content:
            content = change_date_element(comment.content).strip().splitlines()
            first_line = content.pop() if content else ""
        await self.__notify(
            notifier,
            cast(int, comment.user_id),
            NotificationType.ReactedToComment,
            [project, column, card],
            [(project, "project"), (card, "card"), (comment, "comment")],
            {"reaction_type": reaction_type, "line": first_line},
            "reacted_to_comment",
            {"url": self.__create_redirect_url(project, card)},
        )

    async def notify_checklist(
        self, notifier: TUserOrBot, target_user: TUserParam, project: Project, card: Card, checklist: Checklist
    ):
        column = await self.__get_column_by_card(card)
        await self.__notify(
            notifier,
            target_user,
            NotificationType.NotifiedFromChecklist,
            [project, column, card],
            [(project, "project"), (card, "card"), (checklist, "checklist")],
            None,
            "notified_from_checklist",
            {"url": self.__create_redirect_url(project, card)},
        )

    def create_record_list(self, record_list: list[tuple[_TModel, str]]) -> list[tuple[str, SnowflakeID, str]]:
        return [(type(record).__tablename__, record.id, key_name) for record, key_name in record_list]

    # to here, notifiable types are added

    async def __notify_mentioned(
        self,
        notifier: TUserOrBot,
        editor: EditorContentModel | None,
        notification_type: NotificationType,
        scope_models: list[BaseSqlModel],
        record_with_key_names: list[tuple[_TModel, str]],
        email_template_name: TEmailTemplateName,
        email_formats: dict[str, str],
    ):
        if not editor or not editor.content:
            return
        user_or_bot_uids, mentioned_lines = find_mentioned(editor)
        mentioned_in = ""
        other_models: list[BaseSqlModel] = []
        if email_template_name == "mentioned_in_card":
            mentioned_in = "card"
        elif email_template_name == "mentioned_in_comment":
            mentioned_in = "comment"
            other_models = [record_with_key_names[-1][0]]
        elif email_template_name == "mentioned_in_wiki":
            mentioned_in = "project_wiki"

        for user_or_bot_uid in user_or_bot_uids:
            result = await self.__notify(
                notifier,
                user_or_bot_uid,
                notification_type,
                scope_models,
                record_with_key_names,
                {"line": mentioned_lines[user_or_bot_uid]},
                email_template_name,
                email_formats,
            )

            if result or not mentioned_in:
                continue

            target_bot = await self._get_by_param(Bot, user_or_bot_uid)
            if not target_bot or target_bot.id == notifier.id:
                continue

            models = [*scope_models, *other_models]
            dumped_models: list[tuple[str, dict]] = []
            for model in models:
                dumped_models.append((type(model).__tablename__, model.model_dump()))
            BotDefaultTask.bot_mentioned(target_bot, mentioned_in, dumped_models)

    async def __notify(
        self,
        notifier: TUserOrBot,
        target_user: TUserParam,
        notification_type: NotificationType,
        scope_models: list[BaseSqlModel] | None,
        record_with_key_names: list[tuple[_TModel, str]],
        message_vars: dict[str, Any] | None = None,
        email_template_name: TEmailTemplateName | None = None,
        email_formats: dict[str, str] | None = None,
    ) -> bool:
        target_user = cast(User, await self._get_by_param(User, target_user))
        if not target_user or target_user.id == notifier.id:
            return False

        raw_record_list = self.create_record_list(record_with_key_names)
        record_list = [(table_name, int(record_id), key_name) for table_name, record_id, key_name in raw_record_list]
        self.create_record_list(record_with_key_names)

        scope_model_tuples = (
            [(type(scope_model).__tablename__, int(scope_model.id)) for scope_model in scope_models]
            if scope_models
            else None
        )

        if email_formats:
            email_formats["recipient"] = target_user.firstname
            email_formats["sender"] = notifier.get_fullname()

        model = NotificationPublishModel(
            notifier=notifier,
            target_user=target_user,
            notification_type=notification_type,
            scope_models=scope_model_tuples,
            # web
            record_list=record_list,
            message_vars=message_vars or {},
            # email
            email_template_name=email_template_name,
            email_formats=email_formats,
        )
        NotificationPublishService.put_dispather(model)
        return True

    def __create_redirect_url(self, project: Project, card_or_wiki: ProjectWiki | Card | None = None):
        url_chunks = urlparse(FRONTEND_REDIRECT_URL)
        query_string = ""
        if card_or_wiki:
            chunk_query = (
                QUERY_NAMES.BOARD_CARD_CHUNK if isinstance(card_or_wiki, Card) else QUERY_NAMES.BOARD_WIKI_CHUNK
            )
            main_query = QUERY_NAMES.BOARD_CARD if isinstance(card_or_wiki, Card) else QUERY_NAMES.BOARD_WIKI
            query_string = concat(
                chunk_query.value,
                "=",
                project.get_uid(),
                "&",
                main_query.value,
                "=",
                card_or_wiki.get_uid(),
            )
        else:
            query_string = concat(QUERY_NAMES.BOARD.value, "=", project.get_uid())
        url = url_chunks._replace(
            query=concat(
                url_chunks.query,
                "&" if url_chunks.query else "",
                query_string,
            )
        ).geturl()

        return url

    async def __get_column_by_card(self, card: Card):
        column = await self._get_by(ProjectColumn, "id", card.project_column_id)
        return cast(ProjectColumn, column)
