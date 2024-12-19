from ...models import Card, CardAttachment, CardComment, Checkitem, Project, ProjectColumn, ProjectWiki


TProjectParam = Project | int | str
TColumnParam = ProjectColumn | int | str
TCardParam = Card | int | str
TAttachmentParam = CardAttachment | int | str
TCommentParam = CardComment | int | str
TCheckitemParam = Checkitem | int | str
TWikiParam = ProjectWiki | int | str
