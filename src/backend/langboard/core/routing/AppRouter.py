from fastapi import APIRouter
from ..utils.decorators import thread_safe_singleton
from .AppExceptionHandlingRoute import AppExceptionHandlingRoute
from .SocketRouter import SocketRouter


@thread_safe_singleton
class AppRouter:
    """Manages the application's all routers.

    Attributes:
        `api` (`APIRouter`): The API router.
        `socket` (`SocketRouter`): The socket router.
    """

    api: APIRouter
    socket: SocketRouter

    def __init__(self):
        self.api = APIRouter(route_class=AppExceptionHandlingRoute)
        self.socket = SocketRouter()


AppRouter = AppRouter()
