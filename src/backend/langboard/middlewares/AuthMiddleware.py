from fastapi import status
from fastapi.responses import JSONResponse
from starlette.datastructures import Headers
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.routing import BaseRoute, Match
from starlette.types import ASGIApp
from ..core.filter import AuthFilter
from ..core.routing import AppExceptionHandlingRoute
from ..core.security import Auth
from ..models import User


class AuthMiddleware(AuthenticationMiddleware):
    """Checks if the user is authenticated and has the correct permissions."""

    __auto_load__ = False

    def __init__(
        self,
        app: ASGIApp,
        routes: list[BaseRoute],
    ) -> None:
        self.app = app
        self._routes = routes

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        routes: list[BaseRoute] = self._routes
        should_filter = False
        for route in routes:
            if not isinstance(route, AppExceptionHandlingRoute):
                continue

            matches, _ = route.matches(scope)
            if matches == Match.FULL:
                if AuthFilter.exists(route.endpoint):
                    should_filter = True
                break

        if should_filter:
            headers = Headers(scope=scope)
            validation_result = await Auth.validate(headers)

            if isinstance(validation_result, User):
                scope["user"] = validation_result
            elif validation_result == status.HTTP_422_UNPROCESSABLE_ENTITY:
                response = JSONResponse(content={}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
                await response(scope, receive, send)
                return
            else:
                response = JSONResponse(content={}, status_code=status.HTTP_401_UNAUTHORIZED)
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)
