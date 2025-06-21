from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import status
from models import InternalBotSetting, User
from ...security import Auth
from ...services import Service


@AppRouter.api.get(
    "/global/internal-bot/{bot_uid}",
    tags=["Global"],
    responses=OpenApiSchema().suc({"internal_bot": InternalBotSetting.api_schema()}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def get_internal_bot(
    bot_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    internal_bot = await service.internal_bot_setting.get_by_uid(bot_uid)
    if not internal_bot:
        return JsonResponse(content=ApiErrorCode.NF3004, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"internal_bot": internal_bot.api_response(is_setting=user.is_admin)})
