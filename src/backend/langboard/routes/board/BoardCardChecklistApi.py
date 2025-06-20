from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import status
from models import Bot, Checkitem, Checklist, ProjectRole, User
from models.ProjectRole import ProjectRoleAction
from ...filter import RoleFilter
from ...security import Auth, RoleFinder
from ...services import Service
from .scopes import CardChecklistNotifyForm, CardCheckRelatedForm, ChangeRootOrderForm


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/card/{card_uid}/checklist",
    tags=["Board.Card"],
    description="Get card checklists.",
    responses=OpenApiSchema()
    .suc(
        {
            "checklists": [
                (
                    Checklist,
                    {
                        "schema": {
                            "checkitems": [
                                (
                                    Checkitem,
                                    {
                                        "schema": {
                                            "card_uid": "string",
                                            "timer_started_at?": "string",
                                            "cardified_card?": "string",
                                            "user?": User,
                                        }
                                    },
                                ),
                            ]
                        }
                    },
                ),
            ],
        }
    )
    .auth()
    .forbidden()
    .get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_card_checklists(card_uid: str, service: Service = Service.scope()) -> JsonResponse:
    checklists = await service.checklist.get_list(card_uid, as_api=True)
    return JsonResponse(content={"checklists": checklists})


@AppRouter.schema(form=CardCheckRelatedForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checklist",
    tags=["Board.Card.Checklist"],
    description="Create a checklist.",
    responses=(
        OpenApiSchema().suc({"checklist": Checklist}, 201).auth().forbidden().err(404, ApiErrorCode.NF2004).get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def create_checklist(
    project_uid: str,
    card_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.create(user_or_bot, project_uid, card_uid, form.title)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2004, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={
            "checklist": {
                **result.api_response(),
                "checkitems": [],
            }
        },
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.schema(form=CardCheckRelatedForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/checkitem",
    tags=["Board.Card.Checklist"],
    description="Create a checkitem.",
    responses=OpenApiSchema(201).auth().forbidden().err(404, ApiErrorCode.NF2012).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
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
        return JsonResponse(content=ApiErrorCode.NF2012, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(status_code=status.HTTP_201_CREATED)


@AppRouter.schema(form=CardChecklistNotifyForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/notify",
    tags=["Board.Card.Checklist"],
    description="Notify members of the checklist.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2012).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
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
        return JsonResponse(content=ApiErrorCode.NF2012, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=CardCheckRelatedForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/title",
    tags=["Board.Card.Checklist"],
    description="Change checklist title.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2012).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
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
        return JsonResponse(content=ApiErrorCode.NF2012, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=ChangeRootOrderForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/order",
    tags=["Board.Card.Checklist"],
    description="Change checklist order.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2012).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
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
        return JsonResponse(content=ApiErrorCode.NF2012, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/toggle-checked",
    tags=["Board.Card.Checklist"],
    description="Toggle checklist checked.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2012).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def toggle_checklist_checked(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.toggle_checked(user_or_bot, project_uid, card_uid, checklist_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2012, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}",
    tags=["Board.Card.Checklist"],
    description="Delete a checklist.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2012).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def delete_checklist(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.delete(user_or_bot, project_uid, card_uid, checklist_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2012, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
