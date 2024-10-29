from fastapi import Depends
from ..core.db import DbSession
from . import factory
from .ServiceFactory import ServiceFactory


class Service(ServiceFactory):
    def close(self):
        self._serivces.clear()

    @staticmethod
    def scope() -> "Service":
        async def create_factory(db: DbSession = DbSession.scope()):
            service = Service(db)
            try:
                yield service
            finally:
                service.close()

        return Depends(create_factory)

    @property
    def user(self):
        return self._create_or_get_service(factory.UserService)

    @property
    def project(self):
        return self._create_or_get_service(factory.ProjectService)

    @property
    def role(self):
        return self._create_or_get_service(factory.RoleService)

    @property
    def email(self):
        return self._create_or_get_service(factory.EmailService)

    @property
    def chat_history(self):
        return self._create_or_get_service(factory.ChatHistoryService)

    @property
    def bot(self):
        return self._create_or_get_service(factory.BotService)
