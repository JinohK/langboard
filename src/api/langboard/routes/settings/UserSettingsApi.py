from typing import cast
from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from core.types import SafeDateTime
from fastapi import Depends, status
from models import User, UserProfile
from ...publishers import AppSettingPublisher
from ...security import Auth
from ...services import Service
from .Form import CreateUserForm, DeleteSelectedUsersForm, UpdateUserForm, UsersPagination


@AppRouter.api.get(
    "/settings/users",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "list": [
                    (
                        User,
                        {
                            "schema": {
                                "created_at": "string",
                                "activated_at": "string?",
                                **UserProfile.api_schema(),
                                "is_admin": "bool",
                            }
                        },
                    )
                ],
                "count_new_records": "integer",
            }
        )
        .auth()
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("admin")
async def get_users_in_settings(
    pagination: UsersPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.user.get_list(pagination, refer_time=pagination.refer_time, only_count=pagination.only_count)
    if pagination.only_count:
        return JsonResponse(content={"count_new_records": result})
    users, count_new_records = cast(tuple[list[tuple[User, UserProfile]], int], result)

    api_users = []
    for user, profile in users:
        api_user = user.api_response()
        api_user.update(profile.api_response())
        api_user["created_at"] = user.created_at
        api_user["activated_at"] = user.activated_at
        api_user["is_admin"] = user.is_admin
        api_users.append(api_user)

    return JsonResponse(
        content={
            "list": api_users,
            "count_new_records": count_new_records,
        }
    )


@AppRouter.api.post("/settings/users", tags=["AppSettings"], responses=OpenApiSchema(201).auth().forbidden().get())
@AuthFilter.add("admin")
async def create_user_in_settings(form: CreateUserForm, service: Service = Service.scope()) -> JsonResponse:
    user, _ = await service.user.get_by_email(form.email)
    if user:
        return JsonResponse(content=ApiErrorCode.EX1003, status_code=status.HTTP_409_CONFLICT)

    form_dict = form.model_dump()
    if form.should_activate:
        now = SafeDateTime.now()
        form_dict["created_at"] = now
        form_dict["updated_at"] = now
        form_dict["activated_at"] = now

    user, profile = await service.user.create(form_dict)

    await AppSettingPublisher.user_created(user, profile)

    return JsonResponse(status_code=201, content={})


@AppRouter.api.put(
    "/settings/users/{user_uid}", tags=["AppSettings"], responses=OpenApiSchema().auth().forbidden().get()
)
@AuthFilter.add("admin")
async def update_user_in_settings(
    user_uid: str, form: UpdateUserForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    target_user = await service.user.get_by_uid(user_uid)
    if not target_user:
        return JsonResponse(content=ApiErrorCode.EX1001, status_code=status.HTTP_404_NOT_FOUND)

    form_dict = form.model_dump(exclude_unset=True)
    if user.id != target_user.id:
        if form.activate:
            form_dict["activated_at"] = SafeDateTime.now()
        elif form.activate is False:
            form_dict["activated_at"] = None

    await service.user.update(target_user, form_dict, from_setting=True)

    if form.password:
        await service.user.change_password(target_user, form.password)

    return JsonResponse(status_code=200, content={})


@AppRouter.api.delete(
    "/settings/users/{user_uid}", tags=["AppSettings"], responses=OpenApiSchema().auth().forbidden().get()
)
@AuthFilter.add("admin")
async def delete_user_in_settings(
    user_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    target_user = await service.user.get_by_uid(user_uid)
    if not target_user:
        return JsonResponse(content=ApiErrorCode.EX1001, status_code=status.HTTP_404_NOT_FOUND)

    if target_user.id == user.id:
        return JsonResponse(content=ApiErrorCode.EX1004, status_code=status.HTTP_403_FORBIDDEN)

    await service.user.delete(target_user)

    return JsonResponse(status_code=status.HTTP_200_OK, content={})


@AppRouter.api.delete("/settings/users", tags=["AppSettings"], responses=OpenApiSchema().auth().forbidden().get())
@AuthFilter.add("admin")
async def delete_selected_users_in_settings(
    form: DeleteSelectedUsersForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    user_uid = user.get_uid()
    form.user_uids = [uid for uid in form.user_uids if uid != user_uid]

    await service.user.delete_selected(form.user_uids)

    return JsonResponse(status_code=status.HTTP_200_OK, content={})
