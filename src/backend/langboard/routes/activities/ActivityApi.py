from typing import cast
from fastapi import Depends, status
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema.Pagination import Pagination
from ...core.security import Auth
from ...models import User, UserActivity
from ...services import Service


@AppRouter.api.get("/activity/user")
@AuthFilter.add
async def get_user_activities(
    query: Pagination = Depends(), user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    activities = await service.activity.get_activities(UserActivity, cast(int, user.id), query.page, query.limit)
    return JsonResponse(content={"activities": activities}, status_code=status.HTTP_200_OK)
