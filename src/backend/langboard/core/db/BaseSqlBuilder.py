from abc import ABC
from typing import Tuple, overload
from sqlalchemy import Delete, Insert, Update
from sqlalchemy.sql._typing import _DMLTableArgument
from sqlmodel import delete, insert, select, update
from sqlmodel.sql._expression_select_gen import (
    _T0,
    _T1,
    _T2,
    _T3,
    _TCCA,
    _TScalar_0,
    _TScalar_1,
    _TScalar_2,
    _TScalar_3,
)
from sqlmodel.sql.expression import Select, SelectOfScalar
from .Models import SoftDeleteModel


class BaseSqlBuilder(ABC):
    """Provides methods for building SQL statements using `SQLModel`'s and `SQLAlchemy`'s functions.

    The :meth:`update` and :meth:`select` functions include `soft delete functionality`.

    The :meth:`delete` function applies the functionality when executing the statement.
    """

    def build_insert(self, table: _DMLTableArgument) -> Insert:
        return insert(table)

    def build_update(self, table: _DMLTableArgument, with_deleted: bool = False) -> Update:
        statement = update(table)
        if not with_deleted and issubclass(table, SoftDeleteModel):
            statement = statement.where(table.deleted_at is None)
        return statement

    def build_delete(self, table: _DMLTableArgument) -> Delete:
        return delete(table)

    @overload
    def build_select(self, entity0: _TCCA[_T0], with_deleted: bool = False) -> SelectOfScalar[_T0]: ...
    @overload
    def build_select(self, entity0: _TScalar_0, with_deleted: bool = False) -> SelectOfScalar[_TScalar_0]: ...
    @overload
    def build_select(
        self, entity0: _TCCA[_T0], entity1: _TCCA[_T1], with_deleted: bool = False
    ) -> Select[Tuple[_T0, _T1]]: ...
    @overload
    def build_select(
        self, entity0: _TCCA[_T0], entity1: _TScalar_1, with_deleted: bool = False
    ) -> Select[Tuple[_T0, _TScalar_1]]: ...
    @overload
    def build_select(
        self, entity0: _TScalar_0, entity1: _TCCA[_T1], with_deleted: bool = False
    ) -> Select[Tuple[_TScalar_0, _T1]]: ...
    @overload
    def build_select(
        self, entity0: _TScalar_0, entity1: _TScalar_1, with_deleted: bool = False
    ) -> Select[Tuple[_TScalar_0, _TScalar_1]]: ...
    @overload
    def build_select(
        self, entity0: _TCCA[_T0], entity1: _TCCA[_T1], entity2: _TCCA[_T2], with_deleted: bool = False
    ) -> Select[Tuple[_T0, _T1, _T2]]: ...
    @overload
    def build_select(
        self, entity0: _TCCA[_T0], entity1: _TCCA[_T1], entity2: _TScalar_2, with_deleted: bool = False
    ) -> Select[Tuple[_T0, _T1, _TScalar_2]]: ...
    @overload
    def build_select(
        self, entity0: _TCCA[_T0], entity1: _TScalar_1, entity2: _TCCA[_T2], with_deleted: bool = False
    ) -> Select[Tuple[_T0, _TScalar_1, _T2]]: ...
    @overload
    def build_select(
        self, entity0: _TCCA[_T0], entity1: _TScalar_1, entity2: _TScalar_2, with_deleted: bool = False
    ) -> Select[Tuple[_T0, _TScalar_1, _TScalar_2]]: ...
    @overload
    def build_select(
        self, entity0: _TScalar_0, entity1: _TCCA[_T1], entity2: _TCCA[_T2], with_deleted: bool = False
    ) -> Select[Tuple[_TScalar_0, _T1, _T2]]: ...
    @overload
    def build_select(
        self, entity0: _TScalar_0, entity1: _TCCA[_T1], entity2: _TScalar_2, with_deleted: bool = False
    ) -> Select[Tuple[_TScalar_0, _T1, _TScalar_2]]: ...
    @overload
    def build_select(
        self, entity0: _TScalar_0, entity1: _TScalar_1, entity2: _TCCA[_T2], with_deleted: bool = False
    ) -> Select[Tuple[_TScalar_0, _TScalar_1, _T2]]: ...
    @overload
    def build_select(
        self, entity0: _TScalar_0, entity1: _TScalar_1, entity2: _TScalar_2, with_deleted: bool = False
    ) -> Select[Tuple[_TScalar_0, _TScalar_1, _TScalar_2]]: ...
    @overload
    def build_select(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        with_deleted: bool = False,
    ) -> Select[Tuple[_T0, _T1, _T2, _T3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TScalar_3,
        with_deleted: bool = False,
    ) -> Select[Tuple[_T0, _T1, _T2, _TScalar_3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TScalar_2,
        entity3: _TCCA[_T3],
        with_deleted: bool = False,
    ) -> Select[Tuple[_T0, _T1, _TScalar_2, _T3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TScalar_2,
        entity3: _TScalar_3,
        with_deleted: bool = False,
    ) -> Select[Tuple[_T0, _T1, _TScalar_2, _TScalar_3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TCCA[_T0],
        entity1: _TScalar_1,
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        with_deleted: bool = False,
    ) -> Select[Tuple[_T0, _TScalar_1, _T2, _T3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TCCA[_T0],
        entity1: _TScalar_1,
        entity2: _TCCA[_T2],
        entity3: _TScalar_3,
        with_deleted: bool = False,
    ) -> Select[Tuple[_T0, _TScalar_1, _T2, _TScalar_3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TCCA[_T0],
        entity1: _TScalar_1,
        entity2: _TScalar_2,
        entity3: _TCCA[_T3],
        with_deleted: bool = False,
    ) -> Select[Tuple[_T0, _TScalar_1, _TScalar_2, _T3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TCCA[_T0],
        entity1: _TScalar_1,
        entity2: _TScalar_2,
        entity3: _TScalar_3,
        with_deleted: bool = False,
    ) -> Select[Tuple[_T0, _TScalar_1, _TScalar_2, _TScalar_3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TScalar_0,
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        with_deleted: bool = False,
    ) -> Select[Tuple[_TScalar_0, _T1, _T2, _T3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TScalar_0,
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TScalar_3,
        with_deleted: bool = False,
    ) -> Select[Tuple[_TScalar_0, _T1, _T2, _TScalar_3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TScalar_0,
        entity1: _TCCA[_T1],
        entity2: _TScalar_2,
        entity3: _TCCA[_T3],
        with_deleted: bool = False,
    ) -> Select[Tuple[_TScalar_0, _T1, _TScalar_2, _T3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TScalar_0,
        entity1: _TCCA[_T1],
        entity2: _TScalar_2,
        entity3: _TScalar_3,
        with_deleted: bool = False,
    ) -> Select[Tuple[_TScalar_0, _T1, _TScalar_2, _TScalar_3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TScalar_0,
        entity1: _TScalar_1,
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        with_deleted: bool = False,
    ) -> Select[Tuple[_TScalar_0, _TScalar_1, _T2, _T3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TScalar_0,
        entity1: _TScalar_1,
        entity2: _TCCA[_T2],
        entity3: _TScalar_3,
        with_deleted: bool = False,
    ) -> Select[Tuple[_TScalar_0, _TScalar_1, _T2, _TScalar_3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TScalar_0,
        entity1: _TScalar_1,
        entity2: _TScalar_2,
        entity3: _TCCA[_T3],
        with_deleted: bool = False,
    ) -> Select[Tuple[_TScalar_0, _TScalar_1, _TScalar_2, _T3]]: ...
    @overload
    def build_select(
        self,
        entity0: _TScalar_0,
        entity1: _TScalar_1,
        entity2: _TScalar_2,
        entity3: _TScalar_3,
        with_deleted: bool = False,
    ) -> Select[Tuple[_TScalar_0, _TScalar_1, _TScalar_2, _TScalar_3]]: ...
    def build_select(self, *entities: _DMLTableArgument, with_deleted: bool = False) -> SelectOfScalar:
        statement = select(*entities)
        soft_delete_models = [entity for entity in entities if issubclass(entity, SoftDeleteModel)]
        if not with_deleted and soft_delete_models:
            for entity in soft_delete_models:
                statement = statement.where(entity.deleted_at is None)
        return statement
