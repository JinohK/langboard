from fastapi import status
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...services import Service
from .Revert import RevertForm


@AppRouter.api.post("/revert/{any_path:path}")
@AuthFilter.add
async def revert(form: RevertForm, service: Service = Service.scope()) -> JsonResponse:
    result = await service.revert.revert(form.revert_key)

    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})
