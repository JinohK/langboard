from abc import ABC
from typing import Literal, overload
from .queries import DeleteQuery, InsertQuery, SelectQuery, UpdateQuery


class BaseSqlBuilder(ABC):
    """Provides methods for building SQL statements using `SQLModel`'s and `SQLAlchemy`'s functions.

    The :meth:`update` and :meth:`select` functions include `soft delete functionality`.

    The :meth:`delete` function applies the functionality when executing the statement.
    """

    @overload
    def query(self, query_type: Literal["insert"]) -> InsertQuery: ...
    @overload
    def query(self, query_type: Literal["update"]) -> UpdateQuery: ...
    @overload
    def query(self, query_type: Literal["delete"]) -> DeleteQuery: ...
    @overload
    def query(self, query_type: Literal["select"]) -> SelectQuery: ...
    def query(self, query_type: Literal["insert", "update", "delete", "select"]):
        if query_type == "insert":
            return InsertQuery()
        elif query_type == "update":
            return UpdateQuery()
        elif query_type == "delete":
            return DeleteQuery()
        elif query_type == "select":
            return SelectQuery()
        else:
            raise ValueError(f"Invalid query type: {query_type}")
