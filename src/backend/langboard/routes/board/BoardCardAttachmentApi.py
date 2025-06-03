from fastapi import File, UploadFile, status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import ApiErrorCode, AppRouter, JsonResponse
from ...core.routing.Exception import MissingException
from ...core.schema import OpenApiSchema
from ...core.security import Auth, Role
from ...core.storage import Storage, StorageName
from ...models import CardAttachment, ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import ChangeAttachmentNameForm, ChangeChildOrderForm, project_role_finder


@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/attachment",
    tags=["Board.Card.Attachment"],
    responses=(
        OpenApiSchema()
        .suc(
            {**CardAttachment.api_schema(), "user": User},
            201,
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2004)
        .err(500, ApiErrorCode.OP1002)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add("user")
async def upload_card_attachment(
    project_uid: str,
    card_uid: str,
    attachment: UploadFile = File(),
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not attachment:
        raise MissingException("body", "attachment")

    file_model = Storage.upload(attachment, StorageName.CardAttachment)
    if not file_model:
        return JsonResponse(content=ApiErrorCode.OP1002, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    result = await service.card_attachment.create(user, project_uid, card_uid, file_model)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2004, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={**result.api_response(), "user": user.api_response()},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/attachment/{attachment_uid}/order",
    tags=["Board.Card.Attachment"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add("user")
async def change_attachment_order(
    project_uid: str, card_uid: str, attachment_uid: str, form: ChangeChildOrderForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.card_attachment.change_order(project_uid, card_uid, attachment_uid, form.order)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2011, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/attachment/{attachment_uid}/name",
    tags=["Board.Card.Attachment"],
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2003).err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add("user")
async def change_card_attachment_name(
    project_uid: str,
    card_uid: str,
    attachment_uid: str,
    form: ChangeAttachmentNameForm,
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_attachment = await service.card_attachment.get_by_uid(attachment_uid)
    if not card_attachment:
        return JsonResponse(content=ApiErrorCode.NF2011, status_code=status.HTTP_404_NOT_FOUND)

    if card_attachment.user_id != user.id and not user.is_admin:
        role_filter = Role(ProjectRole)
        if not await role_filter.is_authorized(
            user.id, {"project_uid": project_uid}, [ProjectRoleAction.CardUpdate.value], project_role_finder
        ):
            return JsonResponse(content=ApiErrorCode.PE2003, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.card_attachment.change_name(
        user, project_uid, card_uid, card_attachment, form.attachment_name
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2011, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}/attachment/{attachment_uid}",
    tags=["Board.Card.Attachment"],
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2003).err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add("user")
async def delete_card_attachment(
    project_uid: str,
    card_uid: str,
    attachment_uid: str,
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_attachment = await service.card_attachment.get_by_uid(attachment_uid)
    if not card_attachment:
        return JsonResponse(content=ApiErrorCode.NF2011, status_code=status.HTTP_404_NOT_FOUND)

    if card_attachment.user_id != user.id and not user.is_admin:
        role_filter = Role(ProjectRole)
        if not await role_filter.is_authorized(
            user.id, {"project_uid": project_uid}, [ProjectRoleAction.CardUpdate.value], project_role_finder
        ):
            return JsonResponse(content=ApiErrorCode.PE2003, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.card_attachment.delete(user, project_uid, card_uid, card_attachment)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2011, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
