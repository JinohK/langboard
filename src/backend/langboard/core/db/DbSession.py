from datetime import datetime
from typing import Any, Dict, Mapping, Optional, TypeVar, Union, overload
from fastapi import Depends
from fastapi.params import Depends as DependsType
from sqlalchemy import Delete, Insert, Sequence, Update
from sqlalchemy.engine.result import ScalarResult, TupleResult
from sqlalchemy.util import EMPTY_DICT
from sqlmodel import Session, create_engine, update
from sqlmodel.sql.base import Executable
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...Constants import MAIN_DATABASE_ROLE, MAIN_DATABASE_URL, SUB_DATABASE_ROLE, SUB_DATABASE_URL
from ..logger import Logger
from .BaseSqlBuilder import BaseSqlBuilder
from .Models import BaseSqlModel, SoftDeleteModel
from .Role import DbSessionRole


_TSelectParam = TypeVar("_TSelectParam", bound=Any)

_main_engine = create_engine(MAIN_DATABASE_URL)
_sub_engine = create_engine(SUB_DATABASE_URL)

_logger = Logger.use("DbConnection")


class DbSession(BaseSqlBuilder):
    """Manages the database sessions inherited from :class:`BaseSqlBuilder`.

    The purpose of this class is to provide a single interface for multiple database sessions.
    """

    def __init__(self):
        main_session = Session(_main_engine)
        sub_session = Session(_sub_engine)

        # Share the identity map between the main and sub sessions for consistency.
        sub_session.identity_map = main_session.identity_map

        self._sessions: dict[DbSessionRole, Session] = {}
        self._sessions_needs_commit: list[Session] = []

        for role in MAIN_DATABASE_ROLE:
            self._sessions[DbSessionRole(role)] = main_session

        for role in SUB_DATABASE_ROLE:
            self._sessions[DbSessionRole(role)] = sub_session

    def __del__(self):
        if self.should_commit():
            _logger.warning("DbConnection is being deleted without committing.")

        self._sessions_needs_commit.clear()
        self._sessions_needs_commit = None
        for session in self._sessions.values():
            session.close()
        self._sessions.clear()
        self._sessions = None

    @staticmethod
    def scope() -> DependsType:
        """Creates a scope for the database session to be used in :class:`fastapi.FastAPI` endpoints."""

        def get_db():
            db = DbSession()
            try:
                yield db
            finally:
                del db

        return Depends(get_db)

    def insert(self, obj: BaseSqlModel):
        """Inserts a new object into the database if it is new.

        :param obj: The object to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        if not obj.is_new():
            return
        session = self._get_session(DbSessionRole.Insert)
        session.add(obj)

    def insert_all(self, objs: Sequence[BaseSqlModel]):
        """Inserts new objects into the database if they are new.

        :param objs: The objects to be inserted; must be a subclass of :class:`BaseSqlModel`.
        """
        session = self._get_session(DbSessionRole.Insert)
        insertable_objs = [obj for obj in objs if obj.is_new()]
        session.add_all(insertable_objs)

    def update(self, obj: BaseSqlModel):
        """Updates an object in the database if it is not new.

        :param obj: The object to be updated; must be a subclass of :class:`BaseSqlModel`.
        """
        if obj.is_new():
            return
        session = self._get_session(DbSessionRole.Update)
        session.add(obj)

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
        if obj.is_new():
            return
        session = self._get_session(DbSessionRole.Delete)
        if purge or not isinstance(obj, SoftDeleteModel):
            session.delete(obj)
            return
        obj.deleted_at = datetime.now()
        session.add(obj)

    @overload
    def exec(
        self,
        statement: Union[Select[_TSelectParam], SelectOfScalar[_TSelectParam]],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> Union[TupleResult[_TSelectParam], ScalarResult[_TSelectParam]]: ...
    @overload
    def exec(
        self,
        statement: Insert[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> Union[TupleResult[_TSelectParam], ScalarResult[_TSelectParam]]: ...
    @overload
    def exec(
        self,
        statement: Update[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
    ) -> Union[TupleResult[_TSelectParam], ScalarResult[_TSelectParam]]: ...
    @overload
    def exec(
        self,
        statement: Delete[_TSelectParam],
        *,
        params: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        execution_options: Mapping[str, Any] = EMPTY_DICT,
        bind_arguments: Optional[Dict[str, Any]] = None,
        _parent_execute_state: Optional[Any] = None,
        _add_event: Optional[Any] = None,
        purge: bool = False,
    ) -> Union[TupleResult[_TSelectParam], ScalarResult[_TSelectParam]]: ...
    def exec(
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
    ) -> Union[TupleResult[_TSelectParam], ScalarResult[_TSelectParam]]:
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
            and issubclass(statement.table.entity_namespace, SoftDeleteModel)
            and not purge
        ):
            statement = update(statement.table).values(deleted_at=datetime.now()).where(statement.whereclause)

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

        return session.exec(**args)

    def should_commit(self) -> bool:
        """Returns `True` if there are any sessions that need to be committed."""
        return len(self._sessions_needs_commit) > 0

    def commit(self) -> None:
        """Commits all sessions that need to be committed."""
        for session in self._sessions_needs_commit:
            session.commit()
        self._sessions_needs_commit.clear()

    def rollback(self) -> None:
        """Rolls back all sessions that need to be rolled back."""
        for session in self._sessions_needs_commit:
            session.rollback()
        self._sessions_needs_commit.clear()

    def _get_session(self, role: DbSessionRole) -> Session:
        """Returns the session for the given role.

        :param role: The role of the session to be returned.
        """
        session = self._sessions.get(role)
        if role != DbSessionRole.Select:
            self._sessions_needs_commit.add(session)
        return session
