from fastapi import File, UploadFile
from fastapi.responses import JSONResponse
from ...core.filter import AuthFilter
from ...core.routing import AppRouter
from ...core.security import Auth
from ...core.storage import Storage, StorageName
from ...models import User
from ...services import Service
from .Profile import UpdateProfileForm


@AppRouter.api.put("/account/profile")
@AuthFilter.add
async def update_profile(
    form: UpdateProfileForm = UpdateProfileForm.scope(),
    avatar: UploadFile | None = File(None),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JSONResponse:
    file_model = Storage.upload(avatar, StorageName.Avatar) if avatar else None
    form_dict = form.model_dump()
    if file_model:
        form_dict["avatar"] = file_model

    revert_key = await service.user.update_user(user, form_dict)

    return JSONResponse(content={"revert_key": revert_key})
