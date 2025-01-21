from contextlib import asynccontextmanager
from typing import Any, Dict, Iterable, Mapping, Optional, TypeVar, Union, overload
from sqlalchemy import Delete, Insert, Sequence, Update, text
from sqlalchemy.engine.result import ScalarResult, TupleResult
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.util import EMPTY_DICT
from sqlmodel import update
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel.sql.base import Executable
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...Constants import MAIN_DATABASE_ROLE, MAIN_DATABASE_URL, SUB_DATABASE_ROLE, SUB_DATABASE_URL
from ..logger import Logger
from ..utils.DateTime import now
from ..utils.decorators import class_instance, thread_safe_singleton
from .DbSessionRole import DbSessionRole
from .Models import BaseSqlModel, SoftDeleteModel
from .SnowflakeID import SnowflakeID


_TSelectParam = TypeVar("_TSelectParam", bound=Any)


@class_instance()
@thread_safe_singleton
class Engine:
    def get_main_engine(self) -> AsyncEngine:
        return create_async_engine(MAIN_DATABASE_URL)

    def get_sub_engine(self) -> AsyncEngine:
        return create_async_engine(SUB_DATABASE_URL)


_logger = Logger.use("DbConnection")


class DbSession:
    """Manages the database sessions.

    The purpose of this class is to provide a single interface for multiple database sessions.
    """

    def __init__(self):
        main_session = AsyncSession(Engine.get_main_engine(), expire_on_commit=False)
        sub_session = AsyncSession(Engine.get_sub_engine(), expire_on_commit=False)

        self._sessions: dict[DbSessionRole, AsyncSession] = {}
        self._sessions_needs_commit: list[AsyncSession] = []

        for role in MAIN_DATABASE_ROLE:
            self._sessions[DbSessionRole(role)] = main_session

        for role in SUB_DATABASE_ROLE:
            self._sessions[DbSessionRole(role)] = sub_session

    @asynccontextmanager
    @staticmethod
    async def use_db():
        db = DbSession()
        try:
            for session in set(db._sessions.values()):
                await session.exec(text("PRAGMA journal_mode=WAL;"))  # type: ignore
                await session.commit()
            yield db
        finally:
            await db.close()

    async def close(self):
        if self.should_commit():
            for session in self._sessions_needs_commit:
                if session == self._sessions[DbSessionRole.Select]:
                    await session.flush()
            self._sessions_needs_commit = [
                session for session in self._sessions_needs_commit if session != self._sessions[DbSessionRole.Select]
            ]
            if self.should_commit():
                _logger.warning("DbConnection is being closed without committing.")

        await self.rollback()
        for session in self._sessions.values():
            try:
                await session.close()
            except Exception:
                pass
        self._sessions.clear()

    def insert(self, obj: BaseSqlModel):
        """Inserts a new object into the database if it is new.

        :param obj: The object to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        if not obj.is_new():
            return
        obj.id = SnowflakeID()
        session = self._get_session(DbSessionRole.Insert)
        session.add(obj)

    def insert_all(self, objs: Iterable[BaseSqlModel]):
        """Inserts new objects into the database if they are new.

        :param objs: The objects to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        for obj in objs:
            self.insert(obj)

    async def update(self, obj: BaseSqlModel):
        """Updates an object in the database if it is not new.

        :param obj: The object to be updated; must be a subclass of :class:`BaseSqlModel`.
        """
        if obj.is_new() or not obj.has_changes():
            return
        session = self._get_session(DbSessionRole.Update)
        try:
            obj = await session.merge(obj)
        except Exception:
            pass
        session.add(obj)
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
        if obj.is_new():
            return
        session = self._get_session(DbSessionRole.Delete)
        obj = await session.merge(obj)
        if purge or not isinstance(obj, SoftDeleteModel):
            obj.clear_changes()
            await session.delete(obj)
            return
        if obj.deleted_at is not None:
            obj.clear_changes()
            return
        obj.deleted_at = now()
        session.add(obj)
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

        session = self._get_session(role)

        args = {
            "statement": statement,
            "params": params,
            "execution_options": execution_options,
            "bind_arguments": bind_arguments,
            "_parent_execute_state": _parent_execute_state,
            "_add_event": _add_event,
        }

        result = await session.exec(**args)
        if should_return_count:
            return result.rowcount
        return result

    def should_commit(self) -> bool:
        """Returns `True` if there are any sessions that need to be committed."""
        return len(self._sessions_needs_commit) > 0

    async def commit(self) -> None:
        """Commits all sessions that need to be committed."""
        for session in self._sessions_needs_commit:
            try:
                await session.commit()
            except Exception:
                pass

        self._sessions_needs_commit.clear()

    async def rollback(self) -> None:
        """Rolls back all sessions that need to be rolled back."""
        for session in self._sessions_needs_commit:
            if session.is_active:
                await session.rollback()
        self._sessions_needs_commit.clear()

    def _get_session(self, role: DbSessionRole) -> AsyncSession:
        """Returns the session for the given role.

        :param role: The role of the session to be returned.
        """
        session = self._sessions[role]
        # if role != DbSessionRole.Select:
        self._sessions_needs_commit.append(session)
        return session
