from fastapi import Query
from pydantic import BaseModel, Field


class Pagination(BaseModel):
    page: int = Field(Query(default=1, ge=1))
    limit: int = Field(Query(default=1, ge=1))
