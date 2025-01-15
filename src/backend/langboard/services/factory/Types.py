from ...core.ai import Bot
from ...core.db import User
from ...core.setting import AppSetting
from ...models import (
    Card,
    CardAttachment,
    CardComment,
    CheckGroup,
    Checkitem,
    GlobalCardRelationshipType,
    Project,
    ProjectColumn,
    ProjectLabel,
    ProjectWiki,
    UserGroup,
    UserNotification,
)


TUserOrBot = User | Bot
TProjectParam = Project | int | str
TColumnParam = ProjectColumn | int | str
TCardParam = Card | int | str
TAttachmentParam = CardAttachment | int | str
TCommentParam = CardComment | int | str
TCheckGroupParam = CheckGroup | int | str
TCheckitemParam = Checkitem | int | str
TWikiParam = ProjectWiki | int | str
TUserParam = User | int | str
TUserGroupParam = UserGroup | int | str
TProjectLabelParam = ProjectLabel | int | str
TBotParam = Bot | int | str
TSettingParam = AppSetting | int | str
TGlobalCardRelationshipTypeParam = GlobalCardRelationshipType | int | str
TNotificationParam = UserNotification | int | str
