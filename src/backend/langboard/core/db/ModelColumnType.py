from typing import TypeVar
from pydantic import BaseModel
from sqlalchemy import JSON
from sqlalchemy.types import TypeDecorator


TModelColumn = TypeVar("TModelColumn", bound=BaseModel)


def ModelColumnType(_model_type: type[TModelColumn]):
    class _ModelColumnType(TypeDecorator):
        impl = JSON
        cache_ok = True

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
