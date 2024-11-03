from typing import Callable, TypeVar
from ...core.db import DbSession
from ..BaseService import BaseService
from . import roles as factory
from .roles.BaseRoleService import BaseRoleService


_TRoleService = TypeVar("_TRoleService", bound=BaseRoleService)


class RoleService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "role"

    def __init__(self, get_service: Callable, db: DbSession):
        super().__init__(get_service, db)
        self._services: dict[str, BaseRoleService] = {}

    def _create_or_get_service(self, service: type[_TRoleService]) -> _TRoleService:
        service_name = service.__name__
        if service_name not in self._services:
            self._services[service_name] = service(self._db)  # type: ignore
        return self._services[service_name]

    @property
    def project(self):
        return self._create_or_get_service(factory.ProjectRoleService)
