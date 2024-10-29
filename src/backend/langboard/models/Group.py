from sqlmodel import Field
from ..core.db import SoftDeleteModel


class Group(SoftDeleteModel, table=True):
    name: str = Field(unique=True, nullable=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name"]
