from ...core.db import User
from ...core.routing import AppRouter, SocketTopic
from ...services import Service


@AppRouter.socket.subscription_validator(SocketTopic.Dashboard)
async def dashboard_project_subscription_validator(topic_id: str, user: User) -> bool:
    with Service.use() as service:
        result = await service.project.is_assigned(user, topic_id)
    return result


@AppRouter.socket.subscription_validator(SocketTopic.Board)
async def board_subscription_validator(topic_id: str, user: User) -> bool:
    with Service.use() as service:
        result = await service.project.is_assigned(user, topic_id)
    return result


@AppRouter.socket.subscription_validator(SocketTopic.BoardCard)
async def board_card_subscription_validator(topic_id: str, user: User) -> bool:
    with Service.use() as service:
        card = await service.card.get_by_uid(topic_id)
        if not card:
            project = await service.project.get_by_uid(topic_id)
            if not project:
                return False
            target_id = project.id
        else:
            target_id = card.project_id
        result = await service.project.is_assigned(user, target_id)
    return result


@AppRouter.socket.subscription_validator(SocketTopic.BoardWiki)
async def project_wiki_subscription_validator(topic_id: str, user: User) -> bool:
    with Service.use() as service:
        result = await service.project.is_assigned(user, topic_id)
    return result


@AppRouter.socket.subscription_validator(SocketTopic.BoardWikiPrivate)
async def project_wiki_private_subscription_validator(topic_id: str, user: User) -> bool:
    with Service.use() as service:
        result = await service.project_wiki.is_assigned(user, topic_id)
    return result


@AppRouter.socket.subscription_validator(SocketTopic.User)
async def user_subscription_validator(topic_id: str, user: User) -> bool:
    if user.get_uid() == topic_id:
        # Disallow user to subscribe to themselves
        return False

    if user.is_admin:
        return True

    with Service.use() as service:
        target_user = await service.user.get_by_uid(topic_id)
        if not target_user:
            return False
        result = await service.project.is_user_related_to_other_user(user, target_user)
    return result


@AppRouter.socket.subscription_validator(SocketTopic.UserPrivate)
async def user_private_subscription_validator(topic_id: str, user: User) -> bool:
    return user.get_uid() == topic_id
