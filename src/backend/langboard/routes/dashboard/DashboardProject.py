from typing import Any
from pydantic import BaseModel


class DashboardProjectListResponse(BaseModel):
    projects: list[dict[str, Any]]
    total: int
