from abc import ABC, abstractmethod
from typing import Callable, TypeVar, overload
from sqlmodel.sql.expression import Select, SelectOfScalar
from ..core.db import DbSession


_TSelect = TypeVar("_TSelect")
_TService = TypeVar("_TService", bound="BaseService", infer_variance=True)


class BaseService(ABC):
    def __init__(self, get_service: Callable, db: DbSession):
        self._raw_get_service = get_service
        self._db = db

    @staticmethod
    @abstractmethod
    def name() -> str: ...

    def _get_service(self, service: type[_TService]) -> _TService:
        """This method is from :class:`ServiceFactory`.

        The purpose is to share services among services.
        """
        return self._raw_get_service(service)

    @overload
    def paginate(self, statement: Select[_TSelect], page: int, limit: int) -> Select[_TSelect]: ...
    @overload
    def paginate(self, statement: SelectOfScalar[_TSelect], page: int, limit: int) -> SelectOfScalar[_TSelect]: ...
    def paginate(
        self, statement: Select[_TSelect] | SelectOfScalar[_TSelect], page: int, limit: int
    ) -> Select[_TSelect] | SelectOfScalar[_TSelect]:
        return statement.limit(limit).offset((page - 1) * limit)
