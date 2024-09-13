from fastapi import Depends
from .DbSession import DbSession


def get_db_scope():
    """Creates a scope for the database session to be used in :class:`fastapi.FastAPI` endpoints."""

    def get_db():
        db = DbSession()
        try:
            yield db
        finally:
            del db

    return Depends(get_db)
