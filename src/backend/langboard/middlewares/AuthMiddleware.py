from starlette.datastructures import Headers
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.routing import BaseRoute
from starlette.types import ASGIApp
from ..core.ai import Bot
from ..core.db import User
from ..core.filter import AuthFilter, FilterMiddleware
from ..core.routing import JsonResponse
from ..core.security import Auth


class AuthMiddleware(AuthenticationMiddleware, FilterMiddleware):
    """Checks if the user is authenticated and has the correct permissions."""

    __auto_load__ = False

    def __init__(
        self,
        app: ASGIApp,
        routes: list[BaseRoute],
    ):
        FilterMiddleware.__init__(self, app, routes, AuthFilter)

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        should_filter, _ = self.should_filter(scope)

        if should_filter:
            headers = Headers(scope=scope)

            validation_result = await self._validate(headers)
            if isinstance(validation_result, int):
                response = JsonResponse(content={}, status_code=validation_result)
                await response(scope, receive, send)
                return

            scope["auth"] = validation_result

        await self.app(scope, receive, send)

    async def _validate(self, headers: Headers) -> User | Bot | int:
        if headers.get("X-Api-Token", headers.get("x-api-token")):
            validation_result = await Auth.validate_user_by_chatbot(headers)
            if isinstance(validation_result, User):
                return validation_result

            return await Auth.validate_bot(headers)

        return await Auth.validate(headers)
