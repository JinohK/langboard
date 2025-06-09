from json import dumps as json_dumps
from re import findall as re_findall
from typing import Any, Literal, cast
from fastapi import Query, status
from ...Constants import SCHEMA_DIR
from ...core.routing import AppExceptionHandlingRoute, AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.utils.datamodel.parser.jsonschema import JsonSchemaParser


PATH_PARAM_PATTERN = r"\{([^}]+)\}"


@AppRouter.api.get("/openapi.json")
async def openapi_json():
    with open(SCHEMA_DIR / "openapi.json", "r") as f:
        content = f.read()
    return JsonResponse(content=content)


@AppRouter.api.get(
    "/schema/api", tags=["Schema"], responses=OpenApiSchema().suc({"apis": {"<name>": "<description>"}}).get()
)
async def get_api_list():
    apis: dict[str, str] = {}
    for route in AppRouter.api.routes:
        route = cast(AppExceptionHandlingRoute, route)
        if not hasattr(route.endpoint, "_schema"):
            continue
        api_name = route.endpoint.__name__
        apis[api_name] = route.description

    return JsonResponse(content={"apis": apis})


@AppRouter.api.get(
    "/schema/api/spec/{api_name}",
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
                "request_schema_source?": "string",
            }
        }
    )
    .get(),
)
async def get_api_schema(api_name: str):
    for route in AppRouter.api.routes:
        route = cast(AppExceptionHandlingRoute, route)
        name = route.endpoint.__name__
        if not hasattr(route.endpoint, "_schema") or name != api_name:
            continue

        schema = _get_schema(route)

        return JsonResponse(content={"schema": schema})
    return JsonResponse(status_code=status.HTTP_404_NOT_FOUND)


@AppRouter.api.get(
    "/schema/api/list",
    tags=["Schema"],
    responses=OpenApiSchema()
    .suc(
        {
            "schemas": {
                "<api_name>": {
                    "path": "string",
                    "path_params": "array[string]",
                    "method": "string",
                    "content_type": "Literal[application/json, multipart/form-data]",
                    "description": "string",
                    "form?": "object",
                    "query?": "object",
                    "file_field?": "string",
                    "request_schema_source?": "string",
                }
            }
        }
    )
    .get(),
)
async def get_api_schema_list(api_names: str = Query(...)):
    schemas = {}
    api_name_list = api_names.split(",")
    for route in AppRouter.api.routes:
        route = cast(AppExceptionHandlingRoute, route)
        name = route.endpoint.__name__
        if not hasattr(route.endpoint, "_schema") or name not in api_name_list:
            continue

        schema = _get_schema(route)
        schemas[name] = schema

    return JsonResponse(content={"schemas": schemas})


def _get_schema(route: AppExceptionHandlingRoute):
    schema: dict[str, Any] = {**route.endpoint._schema}
    schema["method"] = list(route.methods)[0]
    schema["path"] = route.path
    schema["path_params"] = re_findall(PATH_PARAM_PATTERN, route.path)
    schema["description"] = route.description

    request_source_imports = ["from pydantic import BaseModel, Field"]
    request_source_others = {}
    request_source_model = ["class RequestForm(BaseModel):"]
    for path_param in schema["path_params"]:
        request_source_model.append(f"    {path_param}: str = Field(..., title='Path parameter: {path_param}')")

    if "query" in schema:
        if schema["query"]:
            schema["query"] = schema["query"].model_json_schema()
            imports, request_fields, other_classes = _parse_model("query", schema["query"])
            request_source_imports.extend([imp for imp in imports if imp not in request_source_imports])
            request_source_model.extend(request_fields)
            request_source_others.update(other_classes)
        else:
            schema.pop("query")

    if "form" in schema:
        if schema["form"]:
            schema["form"] = schema["form"].model_json_schema()
            imports, request_fields, other_classes = _parse_model("form", schema["form"])
            request_source_imports.extend([imp for imp in imports if imp not in request_source_imports])
            request_source_model.extend(request_fields)
            request_source_others.update(other_classes)
        else:
            schema.pop("form")

    content_type: str = "application/json"
    if "file_field" in schema:
        if schema["file_field"]:
            content_type = "multipart/form-data"
        else:
            schema.pop("file_field")
    schema["content_type"] = content_type

    if len(request_source_model) > 1:
        schema["request_schema_source"] = "\n".join(
            [
                "\n".join(request_source_imports),
                "\n".join(request_source_others.values()),
                "\n".join(request_source_model),
            ]
        )

    return schema


def _parse_model(form_type: Literal["query", "form"], schema: Any):
    BASE_MODEL_CLASS_PATTERN = r"class (\w+)\(BaseModel\):"

    parser = JsonSchemaParser(json_dumps(schema), use_subclass_enum=True)
    source: str = parser.parse()
    imports: list[str] = []
    other_classes: dict[str, str] = {}
    request_fields: list[str] = []

    started_type: Literal["other", "request"] | None = None
    other_chunks: list[str] = []
    base_model_occurrence = 0
    total_base_model_occurrence = len(re_findall(BASE_MODEL_CLASS_PATTERN, source))
    is_more_than_one_base_model = total_base_model_occurrence > 1

    for line in source.splitlines():
        if line.startswith("from"):
            if "pydantic" not in line and "__future__" not in line:
                imports.append(line)
            continue

        if not line:
            if started_type == "other":
                other_classes[other_chunks[0].split("(")[0].split(" ")[-1]] = "\n".join(other_chunks)
                other_chunks = []
            started_type = None
            continue

        if line.startswith("class"):
            started_type = "request" if "BaseModel" in line else "other"
            if started_type == "request":
                if is_more_than_one_base_model and base_model_occurrence < total_base_model_occurrence - 1:
                    base_model_occurrence += 1
                    started_type = "other"

            if started_type == "other":
                other_chunks = [line]
            continue

        if not started_type:
            continue

        if started_type == "request":
            old_line = line.strip()
            new_line = f"{form_type}_{old_line}"
            line = line.replace(old_line, new_line)
            request_fields.append(line)
        else:
            other_chunks.append(line)

    return imports, request_fields, other_classes
