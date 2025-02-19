from fastapi import status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import CardChecklistNotifyForm, CardCheckRelatedForm, ChangeRootOrderForm, project_role_finder


@AppRouter.schema(form=CardCheckRelatedForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checklist",
    tags=["Board.Card.Checklist"],
    description="Create a checklist.",
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project or card not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_checklist(
    project_uid: str,
    card_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.create(user_or_bot, project_uid, card_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.schema(form=CardCheckRelatedForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/checkitem",
    tags=["Board.Card.Checklist"],
    description="Create a checkitem.",
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or checklist not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_checkitem(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.create(user_or_bot, project_uid, card_uid, checklist_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.schema(form=CardChecklistNotifyForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/notify",
    tags=["Board.Card.Checklist"],
    description="Notify members of the checklist.",
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or checklist not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def notify_checklist(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    form: CardChecklistNotifyForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.notify(user_or_bot, project_uid, card_uid, checklist_uid, form.user_uids)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.schema(form=CardCheckRelatedForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/title",
    tags=["Board.Card.Checklist"],
    description="Change checklist title.",
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or checklist not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checklist_title(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.change_title(user_or_bot, project_uid, card_uid, checklist_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.schema(form=ChangeRootOrderForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/order",
    tags=["Board.Card.Checklist"],
    description="Change checklist order.",
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or checklist not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checklist_order(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    form: ChangeRootOrderForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.change_order(user_or_bot, project_uid, card_uid, checklist_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.schema()
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/toggle-checked",
    tags=["Board.Card.Checklist"],
    description="Toggle checklist checked.",
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or checklist not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def toggle_checklist_checked(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.toggle_checked(user_or_bot, project_uid, card_uid, checklist_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}",
    tags=["Board.Card.Checklist"],
    description="Delete a checklist.",
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or checklist not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_checklist(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.delete(user_or_bot, project_uid, card_uid, checklist_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})
