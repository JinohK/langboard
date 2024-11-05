from fastapi import status
from starlette.datastructures import Headers
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.routing import BaseRoute
from starlette.types import ASGIApp
from ..core.filter import AuthFilter, FilterMiddleware
from ..core.routing import JsonResponse
from ..core.security import Auth
from ..models import User


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
            validation_result = await Auth.validate(headers)

            if isinstance(validation_result, User):
                scope["user"] = validation_result
            elif validation_result == status.HTTP_422_UNPROCESSABLE_ENTITY:
                response = JsonResponse(content={}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
                await response(scope, receive, send)
                return
            else:
                response = JsonResponse(content={}, status_code=status.HTTP_401_UNAUTHORIZED)
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)
