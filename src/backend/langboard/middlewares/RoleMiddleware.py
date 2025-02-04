from fastapi import status
from starlette.routing import BaseRoute
from starlette.types import ASGIApp
from ..core.ai import Bot
from ..core.db import User
from ..core.filter import FilterMiddleware, RoleFilter
from ..core.routing import JsonResponse
from ..core.security import Role


class RoleMiddleware(FilterMiddleware):
    """Checks if the user is authenticated and has the correct permissions."""

    __auto_load__ = False

    def __init__(
        self,
        app: ASGIApp,
        routes: list[BaseRoute],
    ) -> None:
        FilterMiddleware.__init__(self, app, routes, RoleFilter)

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        should_filter, child_scope = self.should_filter(scope)

        if should_filter:
            if "auth" not in scope:
                response = JsonResponse(content={}, status_code=status.HTTP_401_UNAUTHORIZED)
                await response(scope, receive, send)
                return

            user_or_bot: User | Bot = scope["auth"]
            if not user_or_bot.id:
                response = JsonResponse(content={}, status_code=status.HTTP_401_UNAUTHORIZED)
                await response(scope, receive, send)
                return

            if isinstance(user_or_bot, User) and not user_or_bot.is_admin:
                role_model, actions, role_finder = RoleFilter.get_filtered(child_scope["endpoint"])
                role = Role(role_model)

                is_authorized = await role.is_authorized(
                    user_or_bot.id,
                    child_scope["path_params"],
                    actions,
                    role_finder,
                    is_bot=isinstance(user_or_bot, Bot),
                )
                if not is_authorized:
                    response = JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)
                    await response(scope, receive, send)
                    return

        await self.app(scope, receive, send)
