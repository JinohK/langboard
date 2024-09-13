from abc import ABC
from inspect import Parameter, signature
from typing import Type
from fastapi import Depends, Form
from pydantic import BaseModel


class BaseFormModel(ABC, BaseModel):
    """Base class for all form models in the application inherited from :class:`BaseModel`.

    E.g.::

        @form_model
        class UserForm(BaseFormModel):
            email: str
            password: str

        @AppRouter.api.post("/users")
        async def create_user(user: UserForm = get_form_scope(UserForm)):
            ...
    """

    @staticmethod
    def as_form():
        raise NotImplementedError("Must decorate the model class with the `form_model` decorator.")


def form_model(cls: Type[BaseFormModel]) -> Type[BaseFormModel]:
    """Decorates to convert a Pydantic model to a FastAPI form."""
    new_parameters = []

    for field_name in cls.model_fields:
        field = cls.model_fields[field_name]
        new_parameters.append(
            Parameter(
                field.alias if field.alias else field_name,
                Parameter.POSITIONAL_ONLY,
                default=Form(...) if field.is_required() else Form(field.default),
                annotation=field.annotation,
            )
        )

    async def as_form(**data):
        return cls(**data)

    sig = signature(as_form)
    sig = sig.replace(parameters=new_parameters)
    as_form.__signature__ = sig
    setattr(cls, "as_form", as_form)
    return cls


def get_form_scope(cls: Type[BaseFormModel]):
    """Gets the form scope for the given class."""
    return Depends(cls.as_form, use_cache=False)
