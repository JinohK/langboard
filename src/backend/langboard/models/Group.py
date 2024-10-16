from sqlmodel import Field
from ..core.db import BaseSqlModel


class Group(BaseSqlModel, table=True):
    name: str = Field(unique=True, nullable=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name"]
