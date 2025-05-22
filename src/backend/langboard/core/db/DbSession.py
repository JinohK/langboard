from contextlib import asynccontextmanager
from time import sleep
from typing import Any, ClassVar, Dict, Iterable, Mapping, Optional, TypeVar, Union, cast, overload
from asyncpg.exceptions import TooManyConnectionsError
from sqlalchemy import Delete, Insert, Sequence, Update
from sqlalchemy.engine.result import ScalarResult, TupleResult
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.util import EMPTY_DICT
from sqlmodel import update
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel.sql.base import Executable
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...Constants import MAIN_DATABASE_URL, READONLY_DATABASE_URL
from ..logger import Logger
from ..utils.DateTime import now
from .Models import BaseSqlModel, SoftDeleteModel
from .SnowflakeID import SnowflakeID


_TSelectParam = TypeVar("_TSelectParam", bound=Any)


class Engine:
    __main_engine: ClassVar[Optional[AsyncEngine]] = None
    __sub_engine: ClassVar[Optional[AsyncEngine]] = None

    @staticmethod
    def get_main_engine() -> AsyncEngine:
        if Engine.__main_engine:
            return Engine.__main_engine

        url = Engine.__get_sanitized_driver(MAIN_DATABASE_URL)
        return create_async_engine(
            url,
            **Engine.__create_config(url),
        )

    @staticmethod
    def get_readonly_engine() -> AsyncEngine:
        if Engine.__sub_engine:
            return Engine.__sub_engine

        url = Engine.__get_sanitized_driver(READONLY_DATABASE_URL)
        return create_async_engine(
            url,
            **Engine.__create_config(url),
        )

    @staticmethod
    def __create_config(url: str) -> dict[str, Any]:
        if url.startswith("sqlite"):
            return {
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": 30,
                },
                "poolclass": StaticPool,
            }

        if url.startswith("postgresql"):
            return {
                "pool_size": 30,
                "max_overflow": 50,
                "pool_timeout": 60,
                "pool_pre_ping": True,
                "pool_recycle": 1800,
                "echo": False,
            }

        return {}

    @staticmethod
    def __get_sanitized_driver(url: str) -> str:
        splitted = url.split("://", maxsplit=1)
        driver = splitted[0]
        if driver == "sqlite":
            return f"sqlite+aiosqlite://{splitted[1]}"
        if driver == "postgresql":
            return f"postgresql+asyncpg://{splitted[1]}"
        return url


_logger = Logger.use("DbConnection")


class DbSession:
    """Manages the database sessions.

    The purpose of this class is to provide a single interface for multiple database sessions.
    """

    def __init__(self, session: AsyncSession, readonly: bool):
        self.__session = session
        self.__readonly = readonly

    @asynccontextmanager
    @staticmethod
    async def use(readonly: bool):
        try:
            async with DbSession.__create_session(readonly=readonly) as session:
                if readonly:
                    db = DbSession(session, readonly=readonly)
                else:
                    async with session._maker_context_manager():
                        db = DbSession(session, readonly=readonly)
                yield db
                if not readonly:
                    await session.commit()
        finally:
            await db.close()

    @asynccontextmanager
    @staticmethod
    async def __create_session(readonly: bool):
        max_trial = 10
        engine = Engine.get_readonly_engine() if readonly else Engine.get_main_engine()
        session: AsyncSession | None = None
        exception = None
        for _ in range(max_trial):
            exception = None
            try:
                session = AsyncSession(engine, expire_on_commit=False, future=True)
                yield session
                break
            except TooManyConnectionsError as e:
                exception = e
                if session:
                    await session.close()
                sleep(0.5)
                continue
            except TimeoutError as e:
                exception = e
                if session:
                    await session.close()
                sleep(0.5)
                continue
            except Exception as e:
                exception = e
                break

        try:
            if session:
                await session.close()
        except Exception:
            pass

        if exception:
            raise exception

    async def close(self):
        self.__session = cast(AsyncSession, None)
        self.__readonly = True

    async def insert(self, obj: BaseSqlModel):
        """Inserts a new object into the database if it is new.

        :param obj: The object to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        if self.__readonly:
            raise Exception("Cannot insert into a readonly database")

        if not obj.is_new():
            return
        obj.id = SnowflakeID()
        try:
            self.__session.add(obj)
        except Exception:
            await self.__session.rollback()

    async def insert_all(self, objs: Iterable[BaseSqlModel]):
        """Inserts new objects into the database if they are new.

        :param objs: The objects to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        if self.__readonly:
            raise Exception("Cannot insert into a readonly database")

        for obj in objs:
            await self.insert(obj)

    async def update(self, obj: BaseSqlModel):
        """Updates an object in the database if it is not new.

        :param obj: The object to be updated; must be a subclass of :class:`BaseSqlModel`.
        """
        if self.__readonly:
            raise Exception("Cannot update in a readonly database")

        if obj.is_new() or not obj.has_changes():
            return
        try:
            obj = await self.__session.merge(obj)
        except Exception:
            pass
        self.__session.add(obj)
        obj.clear_changes()

    @overload
    async def delete(self, obj: BaseSqlModel): ...
    @overload
    async def delete(self, obj: SoftDeleteModel, purge: bool = False): ...
    async def delete(self, obj: BaseSqlModel, purge: bool = False):
        """Deletes an object from the database if it is not new.

        If the object is a subclass of :class:`SoftDeleteModel`, it will be soft-deleted by default.

        :param obj: The object to be deleted; must be a subclass of :class:`BaseSqlModel`.
        :param purge: If `True`, the object will be hard-deleted for subclasses of :class:`SoftDeleteModel`.
        """
        if self.__readonly:
            raise Exception("Cannot delete from a readonly database")

        if obj.is_new():
            return
        obj = await self.__session.merge(obj)
        try:
            if purge or not isinstance(obj, SoftDeleteModel):
                obj.clear_changes()
                await self.__session.delete(obj)
                return
            if obj.deleted_at is not None:
                obj.clear_changes()
                return
            obj.deleted_at = now()
            self.__session.add(obj)
            obj.clear_changes()
        except Exception:
            await self.__session.rollback()

    @overload
    async def exec(
        self,
        statement: SelectOfScalar[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> ScalarResult[_TSelectParam]: ...
    @overload
    async def exec(
        self,
        statement: Select[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> TupleResult[_TSelectParam]: ...
    @overload
    async def exec(
        self,
        statement: Insert | Insert[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> int: ...
    @overload
    async def exec(
        self,
        statement: Update | Update[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> int: ...
    @overload
    async def exec(
        self,
        statement: Delete | Delete[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
        purge: bool = False,
    ) -> int: ...
    async def exec(  # type: ignore
        self,
        statement: Union[
            Select[_TSelectParam],
            SelectOfScalar[_TSelectParam],
            Executable[_TSelectParam],
        ],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
        purge: bool = False,
    ) -> Union[TupleResult[_TSelectParam], ScalarResult[_TSelectParam]] | int:
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

        result = await self.__session.exec(**args)

        if should_return_count:
            return result.rowcount
        return result
