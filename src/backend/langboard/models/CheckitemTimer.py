from datetime import datetime
from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, DateTimeField
from ..core.utils.DateTime import now
from .Checkitem import Checkitem


class CheckitemTimer(BaseSqlModel, table=True):
    checkitem_uid: str = Field(foreign_key=Checkitem.expr("uid"), nullable=False)
    started_at: datetime = DateTimeField(default=now, nullable=False)
    stopped_at: datetime | None = DateTimeField(default=None, nullable=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "started_at": self.started_at,
            "stopped_at": self.stopped_at,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["checkitem_uid", "started_at", "stopped_at"]
