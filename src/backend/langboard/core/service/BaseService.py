from abc import ABC, abstractmethod
from typing import Any, Callable, Sequence, TypeVar, overload
from sqlalchemy import Delete, Update, func
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlmodel.sql.expression import Select, SelectOfScalar
from ..db import BaseSqlModel, DbSession


_TBaseModel = TypeVar("_TBaseModel", bound=BaseSqlModel)
_TSelect = TypeVar("_TSelect")
_TService = TypeVar("_TService", bound="BaseService", infer_variance=True)
_TStatement = TypeVar("_TStatement", bound=Select | SelectOfScalar | Update | Delete)


class BaseService(ABC):
    @staticmethod
    @abstractmethod
    def name() -> str: ...

    def __init__(self, get_service: Callable, get_service_by_name: Callable, db: DbSession):
        self._raw_get_service = get_service
        self._get_service_by_name = get_service_by_name
        self._db = db

    def _get_service(self, service: type[_TService]) -> _TService:
        """This method is from :class:`ServiceFactory`.

        The purpose is to share services among services.
        """
        return self._raw_get_service(service)

    def _get_service_by_name(self, name: str) -> Any:
        """This method is from :class:`ServiceFactory`.

        The purpose is to share services among services.
        """
        return self._get_service_by_name(name)

    @overload
    def paginate(self, statement: Select[_TSelect], page: int, limit: int) -> Select[_TSelect]: ...
    @overload
    def paginate(self, statement: SelectOfScalar[_TSelect], page: int, limit: int) -> SelectOfScalar[_TSelect]: ...
    def paginate(
        self, statement: Select[_TSelect] | SelectOfScalar[_TSelect], page: int, limit: int
    ) -> Select[_TSelect] | SelectOfScalar[_TSelect]:
        return statement.limit(limit).offset((page - 1) * limit)

    async def _get_by(
        self, model_class: type[_TBaseModel], column: str, value: Any, is_none: bool = False
    ) -> _TBaseModel | None:
        if not is_none and value is None:
            return None
        result = await self._db.exec(
            self._db.query("select").table(model_class).where(model_class.column(column) == value).limit(1)
        )
        return result.first()

    async def _get_all_by(
        self, model_class: type[_TBaseModel], column: str, values: Any | list[Any]
    ) -> Sequence[_TBaseModel]:
        sql_query = self._db.query("select").table(model_class)
        if not isinstance(values, list):
            values = [values]
        sql_query = self._where_in(sql_query, model_class.column(column), values)
        result = await self._db.exec(sql_query)
        return result.all()

    @overload
    def _where_recursive(
        self, statement: Select[_TSelect], model_class: type[_TBaseModel], **kwargs
    ) -> Select[_TSelect]: ...
    @overload
    def _where_recursive(
        self, statement: SelectOfScalar[_TSelect], model_class: type[_TBaseModel], **kwargs
    ) -> SelectOfScalar[_TSelect]: ...
    @overload
    def _where_recursive(self, statement: Update, model_class: type[_TBaseModel], **kwargs) -> Update: ...
    @overload
    def _where_recursive(self, statement: Delete, model_class: type[_TBaseModel], **kwargs) -> Delete: ...
    def _where_recursive(self, statement: _TStatement, model_class: type[_TBaseModel], **kwargs) -> _TStatement:
        if not kwargs:
            return statement
        arg, value = kwargs.popitem()
        if arg in model_class.model_fields and value is not None:
            statement = statement.where(model_class.column(arg) == value)
        return self._where_recursive(statement, model_class, **kwargs)

    @overload
    def _where_in(
        self, statement: Select[_TSelect], column: InstrumentedAttribute, values: Any | list[Any]
    ) -> Select[_TSelect]: ...
    @overload
    def _where_in(
        self, statement: SelectOfScalar[_TSelect], column: InstrumentedAttribute, values: Any | list[Any]
    ) -> SelectOfScalar[_TSelect]: ...
    @overload
    def _where_in(self, statement: Update, column: InstrumentedAttribute, values: Any | list[Any]) -> Update: ...
    @overload
    def _where_in(self, statement: Delete, column: InstrumentedAttribute, values: Any | list[Any]) -> Delete: ...
    def _where_in(self, statement: _TStatement, column: InstrumentedAttribute, values: Any | list[Any]) -> _TStatement:
        if len(values) > 1:
            return statement.where(column.in_(values))
        return statement.where(column == values[0])

    async def _get_max_order(
        self, model_class: type[_TBaseModel], column: str, value: Any, where_clauses: dict[str, Any] | None = None
    ) -> int:
        query = (
            self._db.query("select")
            .columns(func.max(model_class.column("order")), func.count(model_class.column("id")))
            .where(model_class.column(column) == value)
            .group_by(model_class.column(column))
            .limit(1)
        )
        if where_clauses:
            query = self._where_recursive(query, model_class, **where_clauses)
        result = await self._db.exec(query)

        max_order, count_all = result.first() or (None, None)
        if max_order is None or count_all is None:
            max_order = -1
            count_all = 0

        if max_order + 1 != count_all:
            max_order = count_all - 1
            query = (
                self._db.query("select")
                .table(model_class)
                .where(model_class.column(column) == value)
                .order_by(model_class.column("order").asc(), model_class.column("id").asc())
                .group_by(model_class.column("id"), model_class.column("order"))
            )
            if where_clauses:
                query = self._where_recursive(query, model_class, **where_clauses)
            result = await self._db.exec(query)
            rows = result.all()
            i = 0
            for row in rows:
                row.order = i
                await self._db.update(row)
                i += 1
            await self._db.commit()

        return max_order
