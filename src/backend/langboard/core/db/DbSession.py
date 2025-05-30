from contextlib import contextmanager
from time import sleep
from typing import Any, Dict, Generic, Iterable, Mapping, Optional, Sequence, TypeVar, Union, cast, overload
from psycopg.errors import OperationalError as PsycopgOperationalError
from sqlalchemy import Delete, Engine, Insert, IteratorResult, NullPool, Update, create_engine
from sqlalchemy import Sequence as SqlSequence
from sqlalchemy.engine.result import ScalarResult, TupleResult
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import StaticPool
from sqlalchemy.util import EMPTY_DICT
from sqlmodel import Session, update
from sqlmodel.sql.base import Executable
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...Constants import MAIN_DATABASE_URL, PROJECT_NAME, READONLY_DATABASE_URL
from ..logger import Logger
from ..utils.DateTime import now
from ..utils.decorators import class_instance, thread_safe_singleton
from .Models import BaseSqlModel, SoftDeleteModel
from .SnowflakeID import SnowflakeID


_TSelectParam = TypeVar("_TSelectParam", bound=Any)


class Result(Generic[_TSelectParam]):
    def __init__(self, records: Sequence[Any]):
        self.__records = []
        for record in records:
            self.__records.append(self.__copy_record(record))

    def all(self) -> list[_TSelectParam]:
        return self.__records

    def first(self) -> Optional[_TSelectParam]:
        return self.__records[0] if self.__records else None

    def __copy_record(self, record: Any):
        if isinstance(record, BaseSqlModel):
            record = self.__copy_model(record)
        elif isinstance(record, tuple):
            record = self.__convert_tuple_record(record)
        return record

    def __convert_tuple_record(self, record: tuple) -> tuple:
        tuple_record = []
        for item in record:
            if isinstance(item, BaseSqlModel):
                tuple_record.append(self.__copy_model(item))
            else:
                tuple_record.append(item)
        return tuple(tuple_record)

    def __copy_model(self, record: BaseSqlModel) -> BaseSqlModel:
        return record.__class__.model_validate(record.model_dump())


@class_instance()
@thread_safe_singleton
class _Engine:
    __main_engine: Optional[Engine] = None
    __readonly_engine: Optional[Engine] = None

    def get_main_engine(self) -> Engine:
        if self.__main_engine:
            return self.__main_engine

        url = self.__get_sanitized_driver(MAIN_DATABASE_URL)
        return create_engine(
            url,
            **self.__create_config(url),
        )

    def get_readonly_engine(self) -> Engine:
        if self.__readonly_engine:
            return self.__readonly_engine

        url = self.__get_sanitized_driver(READONLY_DATABASE_URL)
        return create_engine(
            url,
            **self.__create_config(url),
        )

    def __create_config(self, url: str) -> dict[str, Any]:
        if url.startswith("sqlite"):
            return {
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": 30,
                },
                "poolclass": StaticPool,
                "pool_pre_ping": True,
            }

        if url.startswith("postgresql"):
            return {
                "connect_args": {
                    "conninfo": f"application_name={PROJECT_NAME}&timeout=120&statement_cache_size=0&tcp_user_timeout=1000",
                },
                "poolclass": NullPool,
                "pool_pre_ping": True,
            }

        return {}

    def __get_sanitized_driver(self, url: str) -> str:
        splitted = url.split("://", maxsplit=1)
        driver = splitted[0]
        if driver == "sqlite":
            return f"sqlite://{splitted[1]}"
        if driver == "postgresql":
            return f"postgresql+psycopg://{splitted[1]}"
        return url


_logger = Logger.use("DbConnection")


class DbSession:
    """Manages the database sessions.

    The purpose of this class is to provide a single interface for multiple database sessions.
    """

    def __init__(self, session: Session, readonly: bool):
        self.__session = session
        self.__readonly = readonly

    @staticmethod
    @contextmanager
    def use(readonly: bool):
        MAX_TRIALS = 10
        for _ in range(MAX_TRIALS):
            session = None
            db = None
            try:
                engine = _Engine.get_readonly_engine() if readonly else _Engine.get_main_engine()
                with Session(engine, expire_on_commit=False) as session:
                    db = DbSession(session, readonly=readonly)
                    with session.begin():
                        yield db
                    session.commit()
                    db.close()
                    session.close()
                    db = None
                    session = None
            except Exception as e:
                if db:
                    db.close()
                if session:
                    session.close()
                if isinstance(e, OperationalError) and isinstance(e.orig, PsycopgOperationalError):
                    if str(e.orig).count("max_client_conn") > 0:
                        sleep(1)
                        _logger.warning(f"Database connection error: {e}. Retrying...")
                        continue
                _logger.exception(e)
                raise e
            finally:
                break

    def close(self):
        self.__session = cast(Session, None)
        self.__readonly = True

    def insert(self, obj: BaseSqlModel):
        """Inserts a new object into the database if it is new.

        :param obj: The object to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        if self.__readonly:
            raise Exception("Cannot insert into a readonly database")

        if not obj.is_new():
            return

        obj.id = SnowflakeID()
        obj = obj.model_validate(obj.model_dump())
        try:
            self.__session.add(obj)
        except Exception:
            pass

    def insert_all(self, objs: Iterable[BaseSqlModel]):
        """Inserts new objects into the database if they are new.

        :param objs: The objects to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        if self.__readonly:
            raise Exception("Cannot insert into a readonly database")

        for obj in objs:
            self.insert(obj)

    def update(self, obj: BaseSqlModel):
        """Updates an object in the database if it is not new.

        :param obj: The object to be updated; must be a subclass of :class:`BaseSqlModel`.
        """
        if self.__readonly:
            raise Exception("Cannot update in a readonly database")

        if obj.is_new() or not obj.has_changes():
            return

        obj.clear_changes()
        obj = obj.model_validate(obj.model_dump())
        try:
            obj = self.__session.merge(obj)
        except Exception:
            self.__session.add(obj)

    @overload
    def delete(self, obj: BaseSqlModel): ...
    @overload
    def delete(self, obj: SoftDeleteModel, purge: bool = False): ...
    def delete(self, obj: BaseSqlModel, purge: bool = False):
        """Deletes an object from the database if it is not new.

        If the object is a subclass of :class:`SoftDeleteModel`, it will be soft-deleted by default.

        :param obj: The object to be deleted; must be a subclass of :class:`BaseSqlModel`.
        :param purge: If `True`, the object will be hard-deleted for subclasses of :class:`SoftDeleteModel`.
        """
        if self.__readonly:
            raise Exception("Cannot delete from a readonly database")

        if obj.is_new():
            return

        obj.clear_changes()
        obj = obj.model_validate(obj.model_dump())

        try:
            obj = self.__session.merge(obj)
        except Exception:
            pass

        try:
            if purge or not isinstance(obj, SoftDeleteModel):
                self.__session.delete(obj)
                return
            if obj.deleted_at is not None:
                return
            obj.deleted_at = now()
            self.__session.add(obj)
        except Exception:
            pass

    @overload
    def exec(
        self,
        statement: SelectOfScalar[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], SqlSequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> Result[_TSelectParam]: ...
    @overload
    def exec(
        self,
        statement: Select[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], SqlSequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> Result[_TSelectParam]: ...
    @overload
    def exec(
        self,
        statement: Insert | Insert[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], SqlSequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> int: ...
    @overload
    def exec(
        self,
        statement: Update | Update[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], SqlSequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> int: ...
    @overload
    def exec(
        self,
        statement: Delete | Delete[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], SqlSequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
        purge: bool = False,
    ) -> int: ...
    def exec(  # type: ignore
        self,
        statement: Union[
            Select[_TSelectParam],
            SelectOfScalar[_TSelectParam],
            Executable[_TSelectParam],
        ],
        *,
        params: Optional[Union[Mapping[str, Any], SqlSequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
        purge: bool = False,
    ) -> Union[Result[_TSelectParam], Result[_TSelectParam]] | int:
        """Executes a statement on the database.

        If the statement is a :class:`Delete` and the table is a subclass of :class:`SoftDeleteModel`,
        the statement will be converted to an :class:`Update` that sets the `deleted_at` column to the current time.
        However, if `purge` is `True`, the statement will be executed as a :class:`Delete`.

        :param statement: The statement to be executed.
        :param params: The parameters to be passed to the statement.
        :param purge: If `True`, the statement will be executed as a :class:`Delete`; Only applicable to :param:`statement` of type :class:`Delete`.
        :param execution_options: The execution options to be passed to the statement.
        :param bind_arguments: The bind arguments to be passed to the statement.
        :param _parent_execute_state: The parent execute state to be passed to the statement.
        :param _add_event: The event to be added to the statement.
        """
        if (
            isinstance(statement, Delete)
            and (
                isinstance(statement.table.entity_namespace, type)
                and issubclass(statement.table.entity_namespace, SoftDeleteModel)
            )
            and not purge
        ):
            statement = update(statement.table).values(deleted_at=now()).where(statement.whereclause)  # type: ignore

        should_return_count = not isinstance(statement, Select) and not isinstance(statement, SelectOfScalar)

        if self.__readonly and should_return_count:
            raise Exception("Cannot execute non-select statements in a readonly database")

        args = {
            "statement": statement,
            "params": params,
            "execution_options": execution_options,
            "bind_arguments": bind_arguments,
            "_parent_execute_state": _parent_execute_state,
            "_add_event": _add_event,
        }

        result = self.__session.exec(**args)

        if should_return_count:
            return result.rowcount

        if isinstance(result, (ScalarResult, TupleResult, IteratorResult)):
            raw_records = result.all()
            result = Result(raw_records)
            return result

        _logger.warning(f"Unexpected result type: {type(result)}")
        return result
