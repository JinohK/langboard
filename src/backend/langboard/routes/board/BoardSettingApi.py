from fastapi import status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.BaseRoleModel import ALL_GRANTED
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import (
    AssignBotsForm,
    ChangeColumnOrderForm,
    CreateProjectLabelForm,
    UpdateProjectDetailsForm,
    UpdateProjectLabelDetailsForm,
    project_role_finder,
)


@AppRouter.api.post("/board/{project_uid}/settings/available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def can_use_settings(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    current_user_role_actions = await service.project.get_user_role_actions(user, project)
    if ProjectRoleAction.Update in current_user_role_actions or ALL_GRANTED in current_user_role_actions:
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)
    else:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)


@AppRouter.api.get("/board/{project_uid}/details")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def get_project_details(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.get_details(user, project_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    project, response = result
    response["description"] = project.description
    response["ai_description"] = project.ai_description
    bots = await service.app_setting.get_bots(as_api=True)

    return JsonResponse(content={"project": response, "bots": bots}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/settings/details")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def change_project_details(
    project_uid: str, form: UpdateProjectDetailsForm, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.update(user, project_uid, form.model_dump())
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/settings/assigned-bots")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_project_assigned_bots(
    project_uid: str, form: AssignBotsForm, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.update_assigned_bots(user, project_uid, form.assigned_bots)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/settings/label")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def create_label_details(
    project_uid: str,
    form: CreateProjectLabelForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.create(user, project_uid, form.name, form.color, form.description)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, api_label = result.data

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={"label": api_label}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/settings/label/{label_uid}/details")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def change_label_details(
    project_uid: str,
    label_uid: str,
    form: UpdateProjectLabelDetailsForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.update(user, project_uid, label_uid, form.model_dump())
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        response = {}
        for key in form.model_fields:
            if ["name", "color", "description"].count(key) == 0:
                continue
            value = getattr(form, key)
            if value is None:
                continue
            response[key] = service.card._convert_to_python(value)
        return JsonResponse(content=response, status_code=status.HTTP_200_OK)

    _, response = result.data

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content=response, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/settings/label/{label_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def change_label_order(
    project_uid: str,
    label_uid: str,
    form: ChangeColumnOrderForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.change_order(user, project_uid, label_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/settings/label/{label_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def delete_label(
    project_uid: str, label_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_label.delete(user, project_uid, label_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
