from ....core.db import EditorContentModel
from ....core.routing import BaseFormModel, form_model


@form_model
class WikiForm(BaseFormModel):
    title: str


@form_model
class ChangeWikiDetailsForm(BaseFormModel):
    title: str | None = None
    content: EditorContentModel | None = None


@form_model
class ChangeWikiPublicForm(BaseFormModel):
    is_public: bool
