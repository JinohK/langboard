from contextlib import asynccontextmanager
from typing import Any, Literal, Sequence, TypeVar, overload
from sqlalchemy import Delete, Update, func
from sqlmodel.sql.expression import Select, SelectOfScalar
from ..db import BaseSqlModel, DbSession, SnowflakeID, SoftDeleteModel, SqlBuilder
from ..utils.decorators import staticclass
from ..utils.ModelUtils import get_model_by_table_name


_TBaseModel = TypeVar("_TBaseModel", bound=BaseSqlModel)
_TSelect = TypeVar("_TSelect")
_TStatement = TypeVar("_TStatement", bound=Select | SelectOfScalar | Update | Delete)


_TBaseModel = TypeVar("_TBaseModel", bound=BaseSqlModel)


@staticclass
class ServiceHelper:
    @staticmethod
    def combine_table_with_ids(
        references: list[tuple[str, SnowflakeID]] | list[tuple[str, int]],
    ) -> dict[str, set[int]]:
        table_ids_dict: dict[str, set[int]] = {}
        for table_name, record_id in references:
            if table_name not in table_ids_dict:
                table_ids_dict[table_name] = set()
            table_ids_dict[table_name].add(record_id)
        return table_ids_dict

    @overload
    @staticmethod
    async def get_references(
        references: list[tuple[str, SnowflakeID]] | list[tuple[str, int]],
        as_type: Literal["api"],
        db: DbSession | None = None,
    ) -> dict[str, dict[str, Any]]: ...
    @overload
    @staticmethod
    async def get_references(
        references: list[tuple[str, SnowflakeID]] | list[tuple[str, int]],
        as_type: Literal["notification"],
        db: DbSession | None = None,
    ) -> dict[str, dict[str, Any]]: ...
    @overload
    @staticmethod
    async def get_references(
        references: list[tuple[str, SnowflakeID]] | list[tuple[str, int]],
        as_type: Literal["raw"],
        db: DbSession | None = None,
    ) -> dict[str, BaseSqlModel]: ...
    @staticmethod
    async def get_references(
        references: list[tuple[str, SnowflakeID]] | list[tuple[str, int]],
        as_type: Literal["api", "notification", "raw"],
        db: DbSession | None = None,
    ) -> dict[str, dict[str, Any]] | dict[str, BaseSqlModel]:
        """Get records by table name and ids.

        Returns:
            dict[str, dict[str, Any]]: "tablename_id" pattern
            dict[str, dict[str, Any]]: {
                "tablename_id": {
                    "id": 1,
                    "name": "test",
                    ...
                }
            }
        """
        table_ids_dict = ServiceHelper.combine_table_with_ids(references)

        cached_dict = {}
        async with ServiceHelper.__use_db(db, readonly=True) as target_db:
            for table_name, record_ids in table_ids_dict.items():
                records = await ServiceHelper.get_records_by_table_name_with_ids(table_name, record_ids, db=target_db)
                if not records:
                    continue

                for record in records:
                    cache_key = f"{table_name}_{record.id}"
                    if cache_key in cached_dict:
                        continue
                    if as_type == "raw":
                        cached_dict[cache_key] = record
                    elif as_type == "api":
                        cached_dict[cache_key] = record.api_response()
                    elif as_type == "notification":
                        cached_dict[cache_key] = record.notification_data()
        return cached_dict

    @staticmethod
    async def get_records_by_table_name_with_ids(
        table_name: str, record_ids: list[SnowflakeID | int] | set[SnowflakeID | int], db: DbSession | None = None
    ) -> Sequence[BaseSqlModel] | None:
        table = get_model_by_table_name(table_name)
        if not table:
            return None

        return await ServiceHelper.get_all_by(table, "id", record_ids, db=db)

    @overload
    @staticmethod
    def paginate(statement: Select[_TSelect], page: int, limit: int) -> Select[_TSelect]: ...
    @overload
    @staticmethod
    def paginate(statement: SelectOfScalar[_TSelect], page: int, limit: int) -> SelectOfScalar[_TSelect]: ...
    @staticmethod
    def paginate(
        statement: Select[_TSelect] | SelectOfScalar[_TSelect], page: int, limit: int
    ) -> Select[_TSelect] | SelectOfScalar[_TSelect]:
        return statement.limit(limit).offset((page - 1) * limit)

    @staticmethod
    def set_order_in_column(query: Update, model_class: type[_TBaseModel], original_order: int, order: int) -> Update:
        if original_order < order:
            query = query.values({model_class.column("order"): model_class.column("order") - 1}).where(
                (model_class.column("order") <= order) & (model_class.column("order") > original_order)
            )
        else:
            query = query.values({model_class.column("order"): model_class.column("order") + 1}).where(
                (model_class.column("order") >= order) & (model_class.column("order") < original_order)
            )
        return query

    @overload
    @staticmethod
    def where_recursive(statement: Select[_TSelect], model_class: type[_TBaseModel], **kwargs) -> Select[_TSelect]: ...
    @overload
    @staticmethod
    def where_recursive(
        statement: SelectOfScalar[_TSelect], model_class: type[_TBaseModel], **kwargs
    ) -> SelectOfScalar[_TSelect]: ...
    @overload
    @staticmethod
    def where_recursive(statement: Update, model_class: type[_TBaseModel], **kwargs) -> Update: ...
    @overload
    @staticmethod
    def where_recursive(statement: Delete, model_class: type[_TBaseModel], **kwargs) -> Delete: ...
    @staticmethod
    def where_recursive(statement: _TStatement, model_class: type[_TBaseModel], **kwargs) -> _TStatement:
        if not kwargs:
            return statement
        arg, value = kwargs.popitem()
        if arg in model_class.model_fields and value is not None:
            if isinstance(value, list):
                statement = statement.where(model_class.column(arg).in_(value))
            else:
                statement = statement.where(model_class.column(arg) == value)
        return ServiceHelper.where_recursive(statement, model_class, **kwargs)

    @staticmethod
    async def get_max_order(
        model_class: type[_TBaseModel],
        column: str,
        value: Any,
        where_clauses: dict[str, Any] | None = None,
        db: DbSession | None = None,
        readonly_db: DbSession | None = None,
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
            query = ServiceHelper.where_recursive(query, model_class, **where_clauses)
        async with ServiceHelper.__use_db(readonly_db, readonly=True) as target_db:
            result = await target_db.exec(query)

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
                query = ServiceHelper.where_recursive(query, model_class, **where_clauses)
            async with ServiceHelper.__use_db(readonly_db, readonly=True) as target_db:
                result = await target_db.exec(query)
            rows = result.all()
            i = 0
            async with ServiceHelper.__use_db(db, readonly=False) as target_db:
                for row in rows:
                    row.order = i
                    await target_db.update(row)
                    i += 1

        return max_order

    @staticmethod
    async def get_by(
        model_class: type[_TBaseModel],
        column: str,
        value: Any,
        is_none: bool = False,
        with_deleted: bool = False,
        db: DbSession | None = None,
    ) -> _TBaseModel | None:
        if not is_none and value is None:
            return None
        result = None
        async with ServiceHelper.__use_db(db, readonly=True) as target_db:
            result = await target_db.exec(
                SqlBuilder.select.table(model_class, with_deleted=with_deleted)
                .where(model_class.column(column) == value)
                .limit(1)
            )
        if not result:
            return None
        return result.first()

    @staticmethod
    async def get_all(
        model_class: type[_TBaseModel], with_deleted: bool = False, db: DbSession | None = None
    ) -> Sequence[_TBaseModel]:
        async with ServiceHelper.__use_db(db, readonly=True) as target_db:
            result = await target_db.exec(SqlBuilder.select.table(model_class, with_deleted=with_deleted))
        return result.all()

    @staticmethod
    async def get_by_param(
        model_class: type[_TBaseModel],
        id_param: _TBaseModel | SnowflakeID | int | str,
        with_deleted: bool = False,
        db: DbSession | None = None,
    ) -> _TBaseModel | None:
        if isinstance(id_param, model_class):
            return id_param
        if isinstance(id_param, SnowflakeID) or isinstance(id_param, int):
            return await ServiceHelper.get_by(model_class, "id", id_param, with_deleted=with_deleted, db=db)
        if isinstance(id_param, str):
            return await ServiceHelper.get_by(
                model_class, "id", SnowflakeID.from_short_code(id_param), with_deleted=with_deleted, db=db
            )
        return None

    @staticmethod
    async def get_all_by(
        model_class: type[_TBaseModel],
        column: str,
        values: Any | list[Any],
        with_deleted: bool = False,
        db: DbSession | None = None,
    ) -> Sequence[_TBaseModel]:
        sql_query = SqlBuilder.select.table(model_class, with_deleted=with_deleted)
        if not isinstance(values, list) and not isinstance(values, set):
            values = [values]
        sql_query = sql_query.where(model_class.column(column).in_(values))
        async with ServiceHelper.__use_db(db, readonly=True) as target_db:
            result = await target_db.exec(sql_query)
        return result.all()

    @staticmethod
    @asynccontextmanager
    async def __use_db(db: DbSession | None, readonly: bool):
        if db is None:
            try:
                async with DbSession.use(readonly=readonly) as db:
                    yield db
            except Exception:
                if db:
                    await db.close()
        else:
            yield db
