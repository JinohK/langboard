from contextlib import asynccontextmanager
from time import sleep
from typing import Any, Dict, Iterable, Literal, Mapping, Optional, TypeVar, Union, overload
from sqlalchemy import Delete, Insert, Sequence, Update
from sqlalchemy.engine.result import ScalarResult, TupleResult
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.util import EMPTY_DICT
from sqlmodel import update
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel.sql.base import Executable
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...Constants import MAIN_DATABASE_ROLE, MAIN_DATABASE_URL, SUB_DATABASE_ROLE, SUB_DATABASE_URL
from ..logger import Logger
from ..utils.DateTime import now
from .DbSessionRole import DbSessionRole
from .Models import BaseSqlModel, SoftDeleteModel
from .SnowflakeID import SnowflakeID


_TSelectParam = TypeVar("_TSelectParam", bound=Any)


class Engine:
    @staticmethod
    def get_main_engine() -> AsyncEngine:
        url = Engine.__get_sanitized_driver(MAIN_DATABASE_URL)
        return create_async_engine(
            url,
            **Engine.__create_config(url),
        )

    @staticmethod
    def get_sub_engine() -> AsyncEngine:
        url = Engine.__get_sanitized_driver(SUB_DATABASE_URL)
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
                }
            }

        if url.startswith("postgresql"):
            return {
                "poolclass": StaticPool,
                "pool_size": 20,
                "max_overflow": 30,
                "pool_timeout": 30,
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

    def __init__(self):
        self._sessions: dict[DbSessionRole, Literal["main", "sub"]] = {}
        for role in MAIN_DATABASE_ROLE:
            self._sessions[DbSessionRole(role)] = "main"

        for role in SUB_DATABASE_ROLE:
            self._sessions[DbSessionRole(role)] = "sub"

    @asynccontextmanager
    @staticmethod
    async def use():
        db = DbSession()
        try:
            yield db
        finally:
            await db.close()

    async def close(self):
        self._sessions.clear()

    async def insert(self, obj: BaseSqlModel):
        """Inserts a new object into the database if it is new.

        :param obj: The object to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        if not obj.is_new():
            return
        obj.id = SnowflakeID()
        async with self.create_session(DbSessionRole.Insert) as session:
            session.begin()
            try:
                session.add(obj)
                await session.commit()
            except Exception:
                await session.rollback()

    async def insert_all(self, objs: Iterable[BaseSqlModel]):
        """Inserts new objects into the database if they are new.

        :param objs: The objects to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        for obj in objs:
            await self.insert(obj)

    async def update(self, obj: BaseSqlModel):
        """Updates an object in the database if it is not new.

        :param obj: The object to be updated; must be a subclass of :class:`BaseSqlModel`.
        """
        if obj.is_new() or not obj.has_changes():
            return
        async with self.create_session(DbSessionRole.Update) as session:
            try:
                obj = await session.merge(obj)
            except Exception:
                pass
            session.add(obj)
            obj.clear_changes()
            await session.commit()

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
        if obj.is_new():
            return
        async with self.create_session(DbSessionRole.Delete) as session:
            obj = await session.merge(obj)
            if purge or not isinstance(obj, SoftDeleteModel):
                obj.clear_changes()
                await session.delete(obj)
                await session.commit()
                return
            if obj.deleted_at is not None:
                obj.clear_changes()
                return
            obj.deleted_at = now()
            session.add(obj)
            await session.commit()
            obj.clear_changes()

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
        if isinstance(statement, Insert):
            role = DbSessionRole.Insert
        elif isinstance(statement, Update):
            role = DbSessionRole.Update
        elif isinstance(statement, Delete):
            role = DbSessionRole.Delete
        elif isinstance(statement, Select) or isinstance(statement, SelectOfScalar):
            role = DbSessionRole.Select
        else:
            raise ValueError(f"Unknown statement type: {type(statement)}")

        args = {
            "statement": statement,
            "params": params,
            "execution_options": execution_options,
            "bind_arguments": bind_arguments,
            "_parent_execute_state": _parent_execute_state,
            "_add_event": _add_event,
        }

        async with self.create_session(role) as session:
            result = await session.exec(**args)
            if role != DbSessionRole.Select:
                await session.commit()

        if should_return_count:
            return result.rowcount
        return result

    def create_session(self, role: DbSessionRole) -> AsyncSession:
        max_trial = 10
        for _ in range(max_trial):
            try:
                session = AsyncSession(self._get_engine(role), expire_on_commit=False)
                return session
            except Exception:
                sleep(0.5)
                continue
        raise Exception(f"Failed to create session after {max_trial}")

    def _get_engine(self, role: DbSessionRole) -> AsyncEngine:
        engine_type = self._sessions.get(role, "main")
        if engine_type == "main":
            return Engine.get_main_engine()
        else:
            return Engine.get_sub_engine()
