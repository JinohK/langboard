from typing import Any
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from ...Constants import PROJECT_NAME, PROJECT_VERSION
from ...core.broker import Broker
from ...core.routing import AppRouter, JsonResponse
from ...models import Bot, ProjectLabel
from ...models.BotTrigger import BotTriggerCondition


@AppRouter.api.get("/schema/bot", tags=["Schema"], response_class=HTMLResponse)
async def bot_docs():
    return get_swagger_ui_html(openapi_url="/schema/bot.json", title=PROJECT_NAME.capitalize())


@AppRouter.api.get("/schema/bot.json", include_in_schema=False)
async def bot_openapi():
    schemas = Broker.get_schema("bot")
    bot_schema = {
        **Bot.api_schema(),
        "app_api_token": "string",
        "prompt": "string",
    }
    bot_schema = _make_object_property("bot", bot_schema)

    label_schema = ProjectLabel.api_schema()
    label_schema = _make_object_property("label", label_schema)

    for schema_name in schemas:
        schema = schemas[schema_name]
        schemas[schema_name] = {
            "title": schema_name.replace("_", " ").capitalize(),
            "type": "object",
            "properties": {
                "event": {"type": "string", "title": "Event", "enum": [schema_name]},
                "data": _make_object_property("data", schema),
                "current_running_bot": {"$ref": "#/shared/Bot"},
                "bot_labels_for_project": {
                    "type": "array",
                    "title": "Labels for Project",
                    "items": {"$ref": "#/shared/ProjectLabel"},
                },
            },
        }

    return JsonResponse(
        content={
            "openapi": "3.1.0",
            "info": {
                "title": PROJECT_NAME.capitalize(),
                "version": PROJECT_VERSION,
            },
            "components": {"schemas": schemas},
            "shared": {
                "Bot": bot_schema,
                "ProjectLabel": label_schema,
            },
        }
    )


@AppRouter.api.get("/schema/bot/trigger-conditions", tags=["Schema"])
async def get_bot_trigger_conditions():
    return JsonResponse(content={"conditions": [condition.value for condition in BotTriggerCondition]})


def _make_object_property(schema_name: str, schema: dict[str, Any]):
    properties, required = _make_property(schema)
    if "as_user" in properties:
        properties.pop("as_user")

    return {
        "type": "object",
        "title": schema_name.replace("_", " ").capitalize(),
        "properties": properties,
        "required": required,
    }


def _make_property(properties: dict[str, Any]):
    required = []
    schema = {}
    for property_name in properties:
        property_value: str | dict = properties[property_name]
        if isinstance(property_value, dict):
            if "oneOf" in property_value:
                schema[property_name] = {
                    "oneOf": [
                        _make_object_property(oneOf, property_value["oneOf"][oneOf])
                        for oneOf in property_value["oneOf"]
                    ]
                }
            else:
                schema[property_name] = _make_object_property(property_name, property_value)
            continue

        if property_value.count("?") == 0:
            required.append(property_name)

        schema[property_name] = {
            "type": property_value.replace("?", ""),
            "title": property_name.replace("_", " ").capitalize(),
        }

    return schema, required
