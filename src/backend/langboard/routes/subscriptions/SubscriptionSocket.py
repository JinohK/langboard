from ...core.db import DbSession, User
from ...core.routing import AppRouter, SocketTopic
from ...services import Service


async def create_service_generator():
    try:
        db = DbSession()
        service = Service(db)
        yield service
    finally:
        service.close()
        await db.close()


@AppRouter.socket.subscription_validator(SocketTopic.Board)
async def board_subscription_validator(topic_id: str, user: User) -> bool:
    async for service in create_service_generator():
        result = await service.project.is_assigned(user, topic_id)
    return result


@AppRouter.socket.subscription_validator(SocketTopic.BoardWiki)
async def project_wiki_subscription_validator(topic_id: str, user: User) -> bool:
    async for service in create_service_generator():
        result = await service.project.is_assigned(user, topic_id)
    return result
