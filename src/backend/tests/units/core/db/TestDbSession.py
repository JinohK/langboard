from datetime import datetime
from typing import Generator
from unittest.mock import MagicMock, patch
from fastapi.params import Depends
from langboard.Constants import MAIN_DATABASE_ROLE, SUB_DATABASE_ROLE
from langboard.core.db import DbSession
from langboard.core.db.Models import BaseSqlModel, SoftDeleteModel
from langboard.core.db.Role import DbSessionRole
from pytest import mark
from sqlmodel import Session


class TestDbModel(BaseSqlModel):
    __test__ = False

    def _get_repr_keys(self) -> list[str]:
        return ["id"]


class TestSoftDeleteModel(SoftDeleteModel):
    __test__ = False

    def _get_repr_keys(self) -> list[str]:
        return ["id"]


class TestDbSession:
    def test_initialization(self):
        db_session = DbSession()

        main_sessions: list[Session] = []
        sub_sessions: list[Session] = []

        for role in MAIN_DATABASE_ROLE:
            main_sessions.append(db_session._sessions[DbSessionRole(role)])

        for role in SUB_DATABASE_ROLE:
            sub_sessions.append(db_session._sessions[DbSessionRole(role)])

        for main_session in main_sessions:
            for sub_session in sub_sessions:
                assert main_session != sub_session
                assert main_session.identity_map == sub_session.identity_map

    @patch("langboard.core.db.DbSession._logger")
    @mark.filterwarnings("ignore::pytest.PytestUnraisableExceptionWarning")
    def test_deletion(self, _logger: MagicMock):
        session = self._create_session()

        session._sessions_needs_commit.append(session._sessions[DbSessionRole.Insert])

        session.__del__()  # calls the method for testing instead of del session

        _logger.warning.assert_called_once_with("DbConnection is being deleted without committing.")
        assert not hasattr(session, "_sessions_needs_commit")
        assert not hasattr(session, "_sessions")

    def test_scope(self):
        scope = DbSession.scope()

        assert isinstance(scope, Depends)

        generator = scope.dependency()

        assert isinstance(generator, Generator)

        session = next(generator)

        assert isinstance(session, DbSession)
        assert session._sessions_needs_commit == []
        assert len(session._sessions) == len(MAIN_DATABASE_ROLE) + len(SUB_DATABASE_ROLE)

        assert next(generator, None) is None

    def test_insert(self):
        db_session = self._create_session()
        session = db_session._sessions[DbSessionRole.Insert]

        for model in self._get_mixed_models():
            db_session.insert(model)

            if model.is_new():
                assert session in db_session._sessions_needs_commit
                session.add.assert_called_once_with(model)
            else:
                assert session not in db_session._sessions_needs_commit
                session.add.assert_not_called()

            db_session._sessions_needs_commit.clear()
            session.add.reset_mock()

    def test_insert_all(self):
        db_session = self._create_session()
        session = db_session._sessions[DbSessionRole.Insert]
        models = self._get_mixed_models()

        db_session.insert_all(models)

        assert session in db_session._sessions_needs_commit
        session.add_all.assert_called_once_with([model for model in models if model.is_new()])

    def test_update(self):
        db_session = self._create_session()
        session = db_session._sessions[DbSessionRole.Update]

        for model in self._get_mixed_models():
            db_session.update(model)

            if not model.is_new():
                assert session in db_session._sessions_needs_commit
                session.add.assert_called_once_with(model)
            else:
                assert session not in db_session._sessions_needs_commit
                session.add.assert_not_called()

            db_session._sessions_needs_commit.clear()
            session.add.reset_mock()

    def test_delete(self):
        db_session = self._create_session()
        session = db_session._sessions[DbSessionRole.Delete]

        for model in self._get_mixed_models():
            db_session.delete(model)

            if model.is_new():
                assert session not in db_session._sessions_needs_commit
                session.delete.assert_not_called()
                session.add.assert_not_called()
                continue

            assert session in db_session._sessions_needs_commit

            if isinstance(model, SoftDeleteModel):
                session.delete.assert_not_called()
                assert isinstance(model.deleted_at, datetime)
                session.add.assert_called_once_with(model)
            else:
                session.delete.assert_called_once_with(model)
                session.add.assert_not_called()

            db_session._sessions_needs_commit.clear()
            session.delete.reset_mock()
            session.add.reset_mock()

            db_session.delete(model, purge=True)

            assert session in db_session._sessions_needs_commit
            session.delete.assert_called_once_with(model)

            db_session._sessions_needs_commit.clear()
            session.delete.reset_mock()

    @mark.skip("Not implemented")
    def test_exec(self):
        pass

    def test_should_commit(self):
        db_session = self._create_session()

        assert db_session.should_commit() is False

        db_session._sessions_needs_commit.append(db_session._sessions[DbSessionRole.Insert])

        assert db_session.should_commit() is True

    def test_commit(self):
        db_session = self._create_session()
        session = db_session._sessions[DbSessionRole.Insert]

        db_session._sessions_needs_commit.append(session)

        db_session.commit()

        session.commit.assert_called_once()

    def test_rollback(self):
        db_session = self._create_session()
        session = db_session._sessions[DbSessionRole.Insert]

        db_session._sessions_needs_commit.append(session)

        db_session.rollback()

        session.rollback.assert_called_once()

    def _create_session(self) -> DbSession:
        db_session = DbSession()

        for role in db_session._sessions:
            mock_session = MagicMock()

            db_session._sessions[role] = mock_session

        return db_session

    def _get_mixed_models(self) -> list[BaseSqlModel]:
        return [
            TestDbModel(),
            TestSoftDeleteModel(),
            TestDbModel(id=1),
            TestDbModel(),
            TestSoftDeleteModel(),
            TestSoftDeleteModel(id=1),
        ]
