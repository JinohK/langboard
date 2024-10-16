from fastapi import status
from fastapi.responses import JSONResponse
from starlette.routing import BaseRoute
from starlette.types import ASGIApp
from ..core.filter import FilterMiddleware, RoleFilter
from ..core.security import Role
from ..models import User


class RoleMiddleware(FilterMiddleware):
    """Checks if the user is authenticated and has the correct permissions."""

    __auto_load__ = False

    def __init__(
        self,
        app: ASGIApp,
        routes: list[BaseRoute],
    ) -> None:
        super().__init__(app, routes, RoleFilter)

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        should_filter, child_scope = self.should_filter(scope)

        if should_filter:
            if "user" not in scope:
                response = JSONResponse(content={}, status_code=status.HTTP_401_UNAUTHORIZED)
                await response(scope, receive, send)
                return

            user: User = scope["user"]
            if not user.id:
                response = JSONResponse(content={}, status_code=status.HTTP_401_UNAUTHORIZED)
                await response(scope, receive, send)
                return

            role_model, actions = RoleFilter.get_filtered(child_scope["endpoint"])
            role = Role(role_model)

            is_authorized = await role.is_authorized(user.id, child_scope["path_params"], actions)
            if not is_authorized:
                response = JSONResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)
