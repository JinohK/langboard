from abc import ABC, abstractmethod
from starlette.types import ASGIApp, Receive, Scope, Send


class BaseMiddleware(ABC):
    __auto_load__ = True

    def __init__(
        self,
        app: ASGIApp,
    ) -> None:
        self.app = app

    @abstractmethod
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None: ...
