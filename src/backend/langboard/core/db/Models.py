from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Optional, TypeVar
from pydantic import SecretStr, model_serializer
from sqlalchemy.orm import declared_attr
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlmodel import Field, SQLModel
from ..utils.DateTime import now
from ..utils.String import pascal_to_snake


_TColumnType = TypeVar("_TColumnType")


class BaseSqlModel(ABC, SQLModel):
    """Bases for all SQL models in the application inherited from :class:`SQLModel`."""

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=now, nullable=False)
    updated_at: datetime = Field(default_factory=now, nullable=False, sa_column_kwargs={"onupdate": now})

    @declared_attr.directive
    def __tablename__(cls) -> str:
        return pascal_to_snake(cls.__name__)

    def __str__(self) -> str:
        return self._repr(self._get_repr_keys())

    def __repr__(self) -> str:
        return str(self)

    def __eq__(self, target: object) -> bool:
        return isinstance(target, self.__class__) and self.id is not None and self.id == target.id

    def __ne__(self, target: object) -> bool:
        return not self.__eq__(target)

    @classmethod
    def column(cls, name: str, _: type[_TColumnType] | None = None) -> InstrumentedAttribute[_TColumnType]:
        """Cast a column to :class:`sqlalchemy.orm.attributes.InstrumentedAttribute`.

        E.g.::

            ModelClass.column("column_name")
            User.column("id")
            ModelClass.column("column_name", int)
            User.column("id", int | None)

        :param name: The column name existing in the model.
        :param _: The type of the column. If provided, it will be assigned to :class:`sqlalchemy.orm.attributes.InstrumentedAttribute`.
        """
        if not isinstance(cls, type) or not issubclass(cls, BaseSqlModel):  # type: ignore
            return None  # type: ignore
        column = getattr(cls, name, None)
        if column is None:
            raise ValueError(f"Column {name} not found in {cls.__name__}")
        if not isinstance(column, InstrumentedAttribute):
            raise ValueError(f'Must use {cls.__name__}.column("{name}")')
        return column

    @classmethod
    def expr(cls, name: str) -> str:
        """Get the column expression from a model column.

        E.g.::

            ModelClass.expr("column_name")
            User.expr("id")

        :param name: The column name existing in the model.
        """
        column = cls.column(name)
        if column is None:
            return name
        return str(column.expression)

    def is_new(self) -> bool:
        """Checks if the object is new and has not been saved to the database."""
        if not isinstance(self, BaseSqlModel):
            return False
        return self.id is None

    @model_serializer
    def serialize(self) -> dict[str, Any]:
        serialized = {}
        for key in self.model_fields:
            value = getattr(self, key)
            if isinstance(value, datetime):
                value = value.isoformat()
            elif isinstance(value, SecretStr):
                value = value.get_secret_value()
            serialized[key] = value
        return serialized

    @abstractmethod
    def _get_repr_keys(self) -> list[str | tuple[str, str]]: ...

    def _repr(self, representable_keys: list[str | tuple[str, str]]) -> str:
        chunks = []
        if not self.is_new():
            chunks.append(f"id={self.id}")

        for representable in representable_keys:
            if isinstance(representable, tuple):
                key, repr_key = representable
            else:
                key = repr_key = representable

            if key == "id":
                continue

            value = getattr(self, key)
            if value is not None:
                chunks.append(f"{repr_key}={value}")

        info = ", ".join(chunks)
        return f"{self.__class__.__name__}({info})"


class SoftDeleteModel(BaseSqlModel):
    """Base model for soft-deleting objects in the database inherited from :class:`BaseSqlModel`."""

    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
