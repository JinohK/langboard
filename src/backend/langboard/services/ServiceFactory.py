from abc import ABC
from typing import TypeVar
from ..core.db import DbSession
from .BaseService import BaseService


_TService = TypeVar("_TService", bound=BaseService)


class ServiceFactory(ABC):
    def __init__(self, db: DbSession):
        self._db = db
        self._serivces: dict[str, BaseService] = {}

    def _create_or_get_service(self, service: type[_TService]) -> _TService:
        service_name = service.name()
        if service_name not in self._serivces:
            self._serivces[service_name] = service(self._create_or_get_service, self._db)

        return self._serivces[service_name]  # type: ignore
