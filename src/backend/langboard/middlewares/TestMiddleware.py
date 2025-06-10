from ..core.routing import BaseMiddleware


class TestMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        print(scope)

        await self.app(scope, receive, send)
