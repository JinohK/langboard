from ...core.db import User
from ...models import Card, CardAttachment, CardComment, Checkitem, Project, ProjectColumn, ProjectWiki, UserGroup


TProjectParam = Project | int | str
TColumnParam = ProjectColumn | int | str
TCardParam = Card | int | str
TAttachmentParam = CardAttachment | int | str
TCommentParam = CardComment | int | str
TCheckitemParam = Checkitem | int | str
TWikiParam = ProjectWiki | int | str
TUserParam = User | int | str
TUserGroupParam = UserGroup | int | str
