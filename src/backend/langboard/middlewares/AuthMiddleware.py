from starlette.types import ASGIApp, Scope, Send, Receive


class AuthMiddleware:
    """Checks if the user is authenticated and has the correct permissions."""

    def __init__(
        self,
        app: ASGIApp,
    ) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        # TODO: Implement the authentication logic here.
        await self.app(scope, receive, send)
