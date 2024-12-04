from fastapi import Depends
from ..core.db import DbSession
from . import factory
from .ServiceFactory import ServiceFactory


class Service(ServiceFactory):
    @staticmethod
    def scope() -> "Service":
        async def create_factory(db: DbSession = DbSession.scope()):
            service = Service(db)
            try:
                yield service
            finally:
                service.close()

        return Depends(create_factory)

    def close(self):
        self._serivces.clear()

    @property
    def activity(self):
        return self._create_or_get_service(factory.ActivityService)

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
    def revert(self):
        return self._create_or_get_service(factory.RevertService)

    @property
    def project_column(self):
        return self._create_or_get_service(factory.ProjectColumnService)

    @property
    def card(self):
        return self._create_or_get_service(factory.CardService)

    @property
    def user_group(self):
        return self._create_or_get_service(factory.UserGroupService)

    @property
    def checkitem(self):
        return self._create_or_get_service(factory.CheckitemService)

    @property
    def reaction(self):
        return self._create_or_get_service(factory.ReactionService)

    @property
    def card_comment(self):
        return self._create_or_get_service(factory.CardCommentService)

    @property
    def card_attachment(self):
        return self._create_or_get_service(factory.CardAttachmentService)
