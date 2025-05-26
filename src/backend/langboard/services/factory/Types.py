from ...core.ai import Bot, BotSchedule
from ...core.db import User
from ...core.setting import AppSetting
from ...models import (
    Card,
    CardAttachment,
    CardComment,
    Checkitem,
    Checklist,
    GlobalCardRelationshipType,
    Project,
    ProjectColumn,
    ProjectLabel,
    ProjectWiki,
    UserGroup,
    UserNotification,
)


TUserOrBot = User | Bot
TProjectParam = Project | int | str | None
TColumnParam = ProjectColumn | int | str | None
TCardParam = Card | int | str | None
TAttachmentParam = CardAttachment | int | str | None
TCommentParam = CardComment | int | str | None
TChecklistParam = Checklist | int | str | None
TCheckitemParam = Checkitem | int | str | None
TWikiParam = ProjectWiki | int | str | None
TUserParam = User | int | str | None
TUserGroupParam = UserGroup | int | str | None
TProjectLabelParam = ProjectLabel | int | str | None
TBotParam = Bot | int | str | None
TSettingParam = AppSetting | int | str | None
TGlobalCardRelationshipTypeParam = GlobalCardRelationshipType | int | str | None
TNotificationParam = UserNotification | int | str | None
TBotScheduleParam = BotSchedule | int | str | None
