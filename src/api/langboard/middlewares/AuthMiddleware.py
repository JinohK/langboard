from core.Env import Env
from core.filter import AuthFilter, FilterMiddleware
from core.routing import ApiErrorCode, JsonResponse
from core.security import AuthSecurity
from fastapi import status
from models import Bot, User
from starlette.datastructures import Headers
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.routing import BaseRoute
from starlette.types import ASGIApp
from ..security import Auth


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
        if scope["type"] != "http" or scope.get("is_batch", False):
            await self.app(scope, receive, send)
            return

        should_filter, child_scope = self.should_filter(scope)
        if should_filter:
            headers = Headers(scope=scope)

            validation_result = await self._validate(headers)
            if isinstance(validation_result, int):
                response = JsonResponse(status_code=validation_result)
                response.delete_cookie(Env.REFRESH_TOKEN_NAME, httponly=True, secure=True)
                await response(scope, receive, send)
                return

            accessible_type = AuthFilter.get_filtered(child_scope["endpoint"])
            if (
                (accessible_type == "bot" and not isinstance(validation_result, Bot))
                or (accessible_type == "user" and not isinstance(validation_result, User))
                or (
                    accessible_type == "admin"
                    and (not isinstance(validation_result, User) or not validation_result.is_admin)
                )
            ):
                response = JsonResponse(content=ApiErrorCode.AU1001, status_code=status.HTTP_403_FORBIDDEN)
                response.delete_cookie(Env.REFRESH_TOKEN_NAME, httponly=True, secure=True)
                await response(scope, receive, send)
                return

            scope["auth"] = validation_result

        await self.app(scope, receive, send)

    async def _validate(self, headers: Headers) -> User | Bot | int:
        if headers.get(AuthSecurity.API_TOKEN_HEADER, headers.get(AuthSecurity.API_TOKEN_HEADER.lower())):
            validation_result = await Auth.validate_user_by_api_token(headers)
            if isinstance(validation_result, User):
                return validation_result

            return await Auth.validate_bot(headers)

        return await Auth.validate(headers)
