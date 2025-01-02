from typing import Any, Callable, TypeVar
from pydantic import BaseModel, SecretStr
from pydantic_core import PydanticUndefined as Undefined
from sqlalchemy import JSON, DateTime
from sqlalchemy.types import TEXT, BigInteger, TypeDecorator
from sqlmodel import Field
from ..utils.DateTime import now
from .SnowflakeID import SnowflakeID


TModelColumn = TypeVar("TModelColumn", bound=BaseModel)


class SnowflakeIDType(TypeDecorator):
    cache_ok = True
    impl = BigInteger

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, SnowflakeID):
            return int(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return SnowflakeID(value)
        return value


def SnowflakeIDField(
    primary_key: bool | None = None,
    foreign_key: Any = Undefined,
    nullable: bool | None = None,
    index: bool | None = None,
) -> Any:
    default_value = None if nullable and not primary_key else SnowflakeID(0)
    return Field(
        default=default_value,
        primary_key=primary_key if primary_key is not None else False,
        foreign_key=foreign_key,
        sa_type=SnowflakeIDType,
        sa_column_kwargs={"nullable": nullable if nullable is not None else True},
        nullable=nullable if nullable is not None else True,
        index=index if index is not None else False,
    )


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
