from fastapi import File, UploadFile
from fastapi.responses import JSONResponse
from ...core.filter import AuthFilter
from ...core.routing import AppRouter
from ...core.routing.Exception import InvalidError, InvalidException
from ...core.security import Auth
from ...core.storage import Storage, StorageName
from ...models import User
from ...services import Service
from .Form import ChangePasswordForm, UpdateProfileForm


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


@AppRouter.api.put("/account/password")
@AuthFilter.add
async def change_password(
    form: ChangePasswordForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JSONResponse:
    if not user.check_password(form.current_password):
        raise InvalidException(InvalidError(loc="body", field="current_password", inputs=form.model_dump()))

    await service.user.change_password(user, form.new_password)
    await Auth.reset_user(user)

    return JSONResponse(content={})
