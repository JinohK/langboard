from typing import Callable, TypeVar
from pydantic import BaseModel, SecretStr
from sqlalchemy import JSON, DateTime
from sqlalchemy.types import TEXT, TypeDecorator
from sqlmodel import Field
from ..utils.DateTime import now


TModelColumn = TypeVar("TModelColumn", bound=BaseModel)


def ModelColumnType(_model_type: type[TModelColumn]):
    class _ModelColumnType(TypeDecorator[_model_type]):
        impl = JSON
        cache_ok = True
        _model_type_class = _model_type

        def process_bind_param(self, value: TModelColumn | None, dialect) -> str | None:
            if value is None:
                return None
            return value.model_dump_json()

        def process_result_value(self, value: dict | str | TModelColumn | None, dialect) -> TModelColumn | None:
            if value is None:
                return None

            if isinstance(value, dict):
                return _model_type(**value)
            elif isinstance(value, str):
                return _model_type.model_validate_json(value)
            else:
                return value

    return _ModelColumnType


class SecretStrType(TypeDecorator):
    impl = TEXT

    def process_bind_param(self, value: SecretStr, dialect) -> str:
        return value.get_secret_value()

    def process_result_value(self, value: str, dialect) -> SecretStr:
        return SecretStr(value)


def DateTimeField(default: Callable | None, nullable: bool, onupdate: bool = False):
    kwargs = {"nullable": nullable, "sa_type": DateTime(timezone=True)}
    if onupdate:
        kwargs["sa_column_kwargs"] = {"onupdate": now}

    if default is None:
        return Field(default=None, **kwargs)
    else:
        return Field(default_factory=default, **kwargs)
