from re import findall as re_findall
from typing import Any, cast
from fastapi import status
from ...core.routing import AppExceptionHandlingRoute, AppRouter, JsonResponse
from ...core.schema import OpenApiSchema


@AppRouter.api.get("/schema/api", tags=["Schema"], responses=OpenApiSchema().suc({"names": ["string"]}).get())
async def get_api_names():
    names: list[str] = []
    for route in AppRouter.api.routes:
        route = cast(AppExceptionHandlingRoute, route)
        if not hasattr(route.endpoint, "_schema"):
            continue
        route_name = route.endpoint.__name__
        names.append(route_name)

    return JsonResponse(content={"names": names})


@AppRouter.api.get(
    "/schema/api/{route_name}",
    tags=["Schema"],
    responses=OpenApiSchema()
    .suc(
        {
            "schema": {
                "path": "string",
                "path_params": "array[string]",
                "method": "string",
                "content_type": "Literal[application/json, multipart/form-data]",
                "description": "string",
                "form?": "object",
                "query?": "object",
                "file_field?": "string",
            }
        }
    )
    .get(),
)
async def get_api_schema(route_name: str):
    PATH_PARAM_PATTERN = r"\{([^}]+)\}"
    for route in AppRouter.api.routes:
        route = cast(AppExceptionHandlingRoute, route)
        name = route.endpoint.__name__
        if not hasattr(route.endpoint, "_schema") or name != route_name:
            continue

        schema: dict[str, Any] = {**route.endpoint._schema}
        schema["method"] = list(route.methods)[0]
        schema["path"] = route.path
        schema["path_params"] = re_findall(PATH_PARAM_PATTERN, route.path)
        schema["description"] = route.description

        if "query" in schema:
            if schema["query"]:
                schema["query"] = schema["query"].model_json_schema()
            else:
                schema.pop("query")

        if "form" in schema:
            if schema["form"]:
                schema["form"] = schema["form"].model_json_schema()
            else:
                schema.pop("form")

        content_type: str = "application/json"
        if "file_field" in schema:
            if schema["file_field"]:
                content_type = "multipart/form-data"
            else:
                schema.pop("file_field")
        schema["content_type"] = content_type

        return JsonResponse(content={"schema": schema})
    return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
