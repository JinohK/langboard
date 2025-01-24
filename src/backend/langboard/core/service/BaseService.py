from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Callable, Sequence, TypeVar, cast, overload
from pydantic import BaseModel
from sqlalchemy import Delete, Update, func
from sqlmodel.sql.expression import Select, SelectOfScalar
from ... import models
from ..ai import Bot
from ..db import BaseSqlModel, DbSession, SnowflakeID, SoftDeleteModel, SqlBuilder, User
from ..setting import AppSetting


_TBaseModel = TypeVar("_TBaseModel", bound=BaseSqlModel)
_TSelect = TypeVar("_TSelect")
_TService = TypeVar("_TService", bound="BaseService", infer_variance=True)
_TStatement = TypeVar("_TStatement", bound=Select | SelectOfScalar | Update | Delete)


class BaseService(ABC):
    @staticmethod
    @abstractmethod
    def name() -> str: ...

    def __init__(self, get_service: Callable, get_service_by_name: Callable):
        self._raw_get_service = get_service
        self._get_service_by_name = get_service_by_name
        self.__tables: dict[str, type[BaseSqlModel]] = {}

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

    async def get_record_by_table_name_with_id(
        self, table_name: str, record_id: SnowflakeID | int
    ) -> BaseSqlModel | None:
        table = self._get_model_by_table_name(table_name)
        if not table:
            return None

        return await self._get_by_param(table, record_id)

    async def _get_by(
        self, model_class: type[_TBaseModel], column: str, value: Any, is_none: bool = False, with_deleted: bool = False
    ) -> _TBaseModel | None:
        if not is_none and value is None:
            return None
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(model_class, with_deleted=with_deleted)
                .where(model_class.column(column) == value)
                .limit(1)
            )
        return result.first()

    async def _get_all(self, model_class: type[_TBaseModel], with_deleted: bool = False) -> Sequence[_TBaseModel]:
        async with DbSession.use() as db:
            result = await db.exec(SqlBuilder.select.table(model_class, with_deleted=with_deleted))
        return result.all()

    async def _get_all_by(
        self, model_class: type[_TBaseModel], column: str, values: Any | list[Any], with_deleted: bool = False
    ) -> Sequence[_TBaseModel]:
        sql_query = SqlBuilder.select.table(model_class, with_deleted=with_deleted)
        if not isinstance(values, list):
            values = [values]
        sql_query = sql_query.where(model_class.column(column).in_(values))
        async with DbSession.use() as db:
            result = await db.exec(sql_query)
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

    async def _get_max_order(
        self, model_class: type[_TBaseModel], column: str, value: Any, where_clauses: dict[str, Any] | None = None
    ) -> int:
        query = (
            SqlBuilder.select.columns(func.max(model_class.column("order")), func.count(model_class.column("id")))
            .where(model_class.column(column) == value)
            .group_by(model_class.column(column))
            .limit(1)
        )
        if issubclass(model_class, SoftDeleteModel):
            query = query.where(model_class.column("deleted_at") == None)  # noqa
        if where_clauses:
            query = self._where_recursive(query, model_class, **where_clauses)
        async with DbSession.use() as db:
            result = await db.exec(query)

        max_order, count_all = result.first() or (None, None)
        if max_order is None or count_all is None:
            max_order = -1
            count_all = 0

        if max_order + 1 != count_all:
            max_order = count_all - 1
            query = (
                SqlBuilder.select.table(model_class)
                .where(model_class.column(column) == value)
                .order_by(model_class.column("order").asc(), model_class.column("id").asc())
                .group_by(model_class.column("id"), model_class.column("order"))
            )
            if where_clauses:
                query = self._where_recursive(query, model_class, **where_clauses)
            async with DbSession.use() as db:
                result = await db.exec(query)
            rows = result.all()
            i = 0
            async with DbSession.use() as db:
                for row in rows:
                    row.order = i
                    await db.update(row)
                    i += 1
                await db.commit()

        return max_order

    async def _get_by_param(
        self,
        model_class: type[_TBaseModel],
        id_param: _TBaseModel | SnowflakeID | int | str,
        with_deleted: bool = False,
    ) -> _TBaseModel | None:
        if isinstance(id_param, model_class):
            return id_param
        if isinstance(id_param, SnowflakeID) or isinstance(id_param, int):
            return await self._get_by(model_class, "id", id_param, with_deleted=with_deleted)
        if isinstance(id_param, str):
            return await self._get_by(
                model_class, "id", SnowflakeID.from_short_code(id_param), with_deleted=with_deleted
            )
        return None

    def _convert_to_python(self, data: Any) -> Any:
        if isinstance(data, BaseModel):
            return data.model_dump()
        elif isinstance(data, datetime):
            return data.isoformat()
        return data

    def _get_model_by_table_name(self, table_name: str) -> type[BaseSqlModel] | None:
        if table_name in self.__tables:
            return self.__tables[table_name]

        if table_name == User.__tablename__:
            self.__tables[table_name] = User
            return User
        elif table_name == Bot.__tablename__:
            self.__tables[table_name] = Bot
            return Bot
        elif table_name == AppSetting.__tablename__:
            self.__tables[table_name] = AppSetting
            return AppSetting
        for model_name in models.__all__:
            model = cast(type[BaseSqlModel], models.__dict__[model_name])
            if model.__tablename__ == table_name:
                self.__tables[table_name] = model
                return model
        return None

    def _set_order_in_column(
        self, query: Update, model_class: type[_TBaseModel], original_order: int, order: int
    ) -> Update:
        if original_order < order:
            query = query.values({model_class.column("order"): model_class.column("order") - 1}).where(
                (model_class.column("order") <= order) & (model_class.column("order") > original_order)
            )
        else:
            query = query.values({model_class.column("order"): model_class.column("order") + 1}).where(
                (model_class.column("order") >= order) & (model_class.column("order") < original_order)
            )
        return query
