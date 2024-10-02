from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class BaseSqlModel(ABC, SQLModel):
    """Bases for all SQL models in the application inherited from :class:`SQLModel`."""

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.now, nullable=False)

    def __str__(self) -> str:
        return self._repr(self._get_repr_keys())

    def __repr__(self) -> str:
        return str(self)

    def __eq__(self, target: object) -> bool:
        return isinstance(target, self.__class__) and self.id is not None and self.id == target.id

    def __ne__(self, target: object) -> bool:
        return not self.__eq__(target)

    def is_new(self) -> bool:
        """Returns `True` if the object is new and has not been inserted into the database."""
        if not isinstance(self, BaseSqlModel):
            return False
        return self.id is None

    @abstractmethod
    def _get_repr_keys(self) -> list[str]: ...

    def _repr(self, representable_keys: list[str]) -> str:
        chunks = []
        if not self.is_new():
            chunks.append(f"id={self.id}")

        for key in representable_keys:
            if key == "id":
                continue
            value = getattr(self, key)
            if value is not None:
                chunks.append(f"{key}={value}")

        info = ", ".join(chunks)
        return f"{self.__class__.__name__}({info})"


class SoftDeleteModel(BaseSqlModel):
    """Base model for soft-deleting objects in the database inherited from :class:`BaseSqlModel`."""

    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
