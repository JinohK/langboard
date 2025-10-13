from core.db import EditorContentModel
from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from core.types import SafeDateTime
from core.utils.Converter import convert_python_data
from fastapi import status
from helpers import ServiceHelper
from models import (
    Bot,
    Card,
    CardAttachment,
    CardBotScope,
    CardComment,
    CardRelationship,
    Checkitem,
    Checklist,
    GlobalCardRelationshipType,
    Project,
    ProjectColumn,
    ProjectLabel,
    ProjectRole,
    User,
)
from models.bases import ALL_GRANTED
from models.ProjectRole import ProjectRoleAction
from ...filter import RoleFilter
from ...security import Auth, RoleFinder
from ...services import Service
from .forms import (
    AssignUsersForm,
    ChangeCardDetailsForm,
    ChangeChildOrderForm,
    CreateCardForm,
    UpdateCardLabelsForm,
    UpdateCardRelationshipsForm,
)


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/card/{card_uid}",
    tags=["Board.Card"],
    description="Get card details.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "card": (
                    Card,
                    {
                        "schema": {
                            "column_name": "string",
                            "project_members": [User],
                            "labels": [ProjectLabel],
                            "member_uids": "string[]",
                            "relationships": [CardRelationship],
                            "current_auth_role_actions": [
                                ALL_GRANTED,
                                ProjectRoleAction,
                            ],
                        }
                    },
                ),
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
                "attachments": [CardAttachment],
                "global_relationships": [GlobalCardRelationshipType],
                "project_columns": [(ProjectColumn, {"schema": {"count": "integer"}})],
                "project_labels": [ProjectLabel],
                "bot_scopes": [CardBotScope],
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2003)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_card_details(
    project_uid: str,
    card_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)
    project, card = params
    api_card = await service.card.get_details(project_uid, card)
    if api_card is None:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)
    global_relationships = await service.app_setting.get_global_relationships(as_api=True)
    bot_scopes = []
    can_set_scopes = isinstance(user_or_bot, Bot)
    if isinstance(user_or_bot, User):
        actions = await service.project.get_one_actions(user_or_bot, project)
        api_card["current_auth_role_actions"] = actions
        can_set_scopes = ALL_GRANTED in actions or ProjectRoleAction.Update.value in actions
    if can_set_scopes:
        bot_scopes = await service.card.get_bot_scopes(project, card, as_api=True)

    project_columns = await service.project_column.get_all_by_project(project.id, as_api=True)
    project_labels = await service.project_label.get_all(project, as_api=True)

    checklists = await service.checklist.get_list(card, as_api=True)
    attachments = await service.card_attachment.get_board_list(card)

    return JsonResponse(
        content={
            "card": api_card,
            "checklists": checklists,
            "attachments": attachments,
            "global_relationships": global_relationships,
            "project_columns": project_columns,
            "project_labels": project_labels,
            "bot_scopes": bot_scopes,
        }
    )


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/card/{card_uid}/comments",
    tags=["Board.Card"],
    description="Get card comments.",
    responses=OpenApiSchema()
    .suc(
        {
            "comments": [
                (
                    CardComment,
                    {
                        "schema": {
                            "user?": User,
                            "bot?": Bot,
                            "reactions": {"<reaction type>": ["<user or bot uid>"]},
                        }
                    },
                ),
            ]
        }
    )
    .auth()
    .forbidden()
    .get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_card_comments(card_uid: str, service: Service = Service.scope()) -> JsonResponse:
    comments = await service.card_comment.get_board_list(card_uid)
    return JsonResponse(content={"comments": comments})


@AppRouter.schema(form=CreateCardForm)
@AppRouter.api.post(
    "/board/{project_uid}/card",
    tags=["Board.Card"],
    description="Create a card.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "card": (
                    Card,
                    {
                        "schema": {
                            "labels": [ProjectLabel],
                            "member_uids": "string[]",
                            "relationships": [CardRelationship],
                            "current_auth_role_actions": [
                                ALL_GRANTED,
                                ProjectRoleAction,
                            ],
                        }
                    },
                )
            },
            201,
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2004)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def create_card(
    project_uid: str,
    form: CreateCardForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card.create(
        user_or_bot,
        project_uid,
        form.column_uid,
        form.title,
        form.description,
        form.assign_users,
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2004, status_code=status.HTTP_404_NOT_FOUND)
    _, api_card = result

    return JsonResponse(content={"card": api_card}, status_code=status.HTTP_201_CREATED)


@AppRouter.schema(form=ChangeCardDetailsForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/details",
    tags=["Board.Card"],
    description="Change card details.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "title?": "string",
                "deadline_at?": "string",
                "description?": EditorContentModel.api_schema(),
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2003)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def change_card_details(
    project_uid: str,
    card_uid: str,
    form: ChangeCardDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    form_dict = {}
    for key in ChangeCardDetailsForm.model_fields:
        value = getattr(form, key)
        if value is None:
            continue
        elif key == "deadline_at":
            if value:
                value = SafeDateTime.fromisoformat(value)
                if value.tzinfo is None:
                    value = value.replace(tzinfo=SafeDateTime.now().astimezone().tzinfo)
            else:
                value = None
        form_dict[key] = value

    result = await service.card.update(user_or_bot, project_uid, card_uid, form_dict)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        response = {}
        for key in ChangeCardDetailsForm.model_fields:
            if ["title", "description", "deadline_at"].count(key) == 0:
                continue
            value = getattr(form, key)
            if value is None and key != "deadline_at":
                continue
            response[key] = convert_python_data(value)
        return JsonResponse(content=response)

    return JsonResponse(content=result)


@AppRouter.schema(form=AssignUsersForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/assigned-users",
    tags=["Board.Card"],
    description="Assign users to a card.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def update_card_assigned_users(
    project_uid: str,
    card_uid: str,
    form: AssignUsersForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card.update_assigned_users(user_or_bot, project_uid, card_uid, form.assigned_users)
    if result is None:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=ChangeChildOrderForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/order",
    tags=["Board.Card"],
    description="Change card order or move to another project column.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def change_card_order_or_move_column(
    project_uid: str,
    card_uid: str,
    form: ChangeChildOrderForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card.change_order(user_or_bot, project_uid, card_uid, form.order, form.parent_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=UpdateCardLabelsForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/labels",
    tags=["Board.Card"],
    description="Update assigned labels to a card.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def update_card_labels(
    project_uid: str,
    card_uid: str,
    form: UpdateCardLabelsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card.update_labels(user_or_bot, project_uid, card_uid, form.labels)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=UpdateCardRelationshipsForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/relationships",
    tags=["Board.Card"],
    description="Update card relationships.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def update_card_relationships(
    project_uid: str,
    card_uid: str,
    form: UpdateCardRelationshipsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card_relationship.update(
        user_or_bot, project_uid, card_uid, form.is_parent, form.relationships
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/archive",
    tags=["Board.Card"],
    description="Archive a card.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def archive_card(
    project_uid: str,
    card_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)

    column = await service.project_column.get_or_create_archive_if_not_exists(project.id)

    result = await service.card.change_order(user_or_bot, project, card_uid, 0, column)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}",
    tags=["Board.Card"],
    description="Delete a card. (Only available for archived cards)",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardDelete], RoleFinder.project)
@AuthFilter.add()
async def delete_card(
    project_uid: str,
    card_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card.delete(user_or_bot, project_uid, card_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
