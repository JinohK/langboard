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


@AppRouter.socket.subscription_validator(SocketTopic.Dashboard)
async def dashboard_subscription_validator(topic_id: str, user: User) -> bool:
    async for service in create_service_generator():
        result = await service.project.is_assigned(user, topic_id)
    return result


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


@AppRouter.socket.subscription_validator(SocketTopic.BoardWikiPrivate)
async def project_wiki_private_subscription_validator(topic_id: str, user: User) -> bool:
    async for service in create_service_generator():
        result = await service.project_wiki.is_assigned(user, topic_id)
    return result


@AppRouter.socket.subscription_validator(SocketTopic.User)
async def user_subscription_validator(topic_id: str, user: User) -> bool:
    if user.get_uid() == topic_id:
        # Disallow user to subscribe to themselves
        return False

    async for service in create_service_generator():
        target_user = await service.user.get_by_uid(topic_id)
        if not target_user:
            return False
        result = await service.project.is_user_related_to_other_user(user, target_user)
    return result
