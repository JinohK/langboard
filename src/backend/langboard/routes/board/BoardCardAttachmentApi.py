from fastapi import File, UploadFile, status
from ...core.db import DbSession, User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth, Role
from ...core.storage import Storage, StorageName
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import ChangeAttachmentNameForm, ChangeOrderForm, project_role_finder


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/attachment")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def upload_card_attachment(
    project_uid: str,
    card_uid: str,
    attachment: UploadFile = File(),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not attachment:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    file_model = Storage.upload(attachment, StorageName.CardAttachment)
    if not file_model:
        return JsonResponse(content={}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    result = await service.card_attachment.create(user, project_uid, card_uid, file_model)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={**result.api_response(), "user": user.api_response()},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/attachment/{attachment_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_attachment_order(
    project_uid: str,
    card_uid: str,
    attachment_uid: str,
    form: ChangeOrderForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card_attachment.change_order(project_uid, card_uid, attachment_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/attachment/{attachment_uid}/name")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def change_card_attachment_name(
    project_uid: str,
    card_uid: str,
    attachment_uid: str,
    form: ChangeAttachmentNameForm,
    user: User = Auth.scope("api"),
    db: DbSession = DbSession.scope(),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_attachment = await service.card_attachment.get_by_uid(attachment_uid)
    if not card_attachment:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if card_attachment.user_id != user.id and not user.is_admin:
        role_filter = Role(ProjectRole, db)
        if not await role_filter.is_authorized(
            user.id, {"project_uid": project_uid}, [ProjectRoleAction.CardUpdate.value], project_role_finder
        ):
            return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.card_attachment.change_name(
        user, project_uid, card_uid, card_attachment, form.attachment_name
    )
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}/attachment/{attachment_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def delete_card_attachment(
    project_uid: str,
    card_uid: str,
    attachment_uid: str,
    user: User = Auth.scope("api"),
    db: DbSession = DbSession.scope(),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_attachment = await service.card_attachment.get_by_uid(attachment_uid)
    if not card_attachment:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if card_attachment.user_id != user.id and not user.is_admin:
        role_filter = Role(ProjectRole, db)
        if not await role_filter.is_authorized(
            user.id, {"project_uid": project_uid}, [ProjectRoleAction.CardUpdate.value], project_role_finder
        ):
            return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.card_attachment.delete(user, project_uid, card_uid, card_attachment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
