from enum import Enum
from typing import Any, Literal, Self, cast
from fastapi import status
from fastapi.openapi.constants import REF_PREFIX
from ..db import BaseSqlModel


class OpenApiSchema:
    def __init__(self, use_success: bool = True) -> None:
        self.__schema: dict[int | str, dict[str, Any]] = {
            status.HTTP_400_BAD_REQUEST: {
                "description": "Invalid request.",
                "content": {"application/json": {"schema": {"$ref": REF_PREFIX + "ValidationError"}}},
            },
            "default": {},
        }

        if use_success:
            self.__schema[status.HTTP_200_OK] = {
                "description": "Successful response.",
                "content": self.__empty_schema(),
            }

    def suc(self, schema: dict[str, Any], status_code: Literal[200, 201] = 200) -> Self:
        if status_code != 200:
            self.__schema.pop(status.HTTP_200_OK, None)

        for key, value in schema.items():
            schema[key] = self.__make_schema_recursive(value)

        self.__schema[status_code] = {
            "description": "Successful response.",
            "content": {"application/json": {"example": schema}},
        }
        return self

    def err(self, status_code: int, description: str) -> Self:
        self.__schema[status_code] = {"description": description, "content": self.__empty_schema()}
        return self

    def auth(self, with_bot: bool = False) -> Self:
        description_401 = "Authentication token is invalid."
        if with_bot:
            description_401 = "Authentication token is invalid or Bot api token is invalid."

        self.__schema[status.HTTP_401_UNAUTHORIZED] = {
            "description": description_401,
            "content": self.__empty_schema(),
        }
        self.__schema[status.HTTP_422_UNPROCESSABLE_ENTITY] = {
            "description": "Authentication token is expired.",
            "content": self.__empty_schema(),
        }
        return self

    def role(self, with_bot: bool = False) -> Self:
        description_403 = "User does not have the required role."
        if with_bot:
            description_403 = "User or bot does not have the required role."
        self.__schema[status.HTTP_403_FORBIDDEN] = {
            "description": description_403,
            "content": self.__empty_schema(),
        }

        return self

    def no_bot(self) -> Self:
        self.__schema[status.HTTP_403_FORBIDDEN] = {
            "description": "Bot cannot access this endpoint.",
            "content": self.__empty_schema(),
        }
        return self

    def only_bot(self) -> Self:
        self.__schema[status.HTTP_401_UNAUTHORIZED] = {
            "description": "Bot api token is invalid.",
            "content": self.__empty_schema(),
        }
        self.__schema[status.HTTP_403_FORBIDDEN] = {
            "description": "Only bot can access this endpoint.",
            "content": self.__empty_schema(),
        }
        return self

    def only_admin(self) -> Self:
        self.__schema[status.HTTP_403_FORBIDDEN] = {
            "description": "Only admin can access this endpoint.",
            "content": self.__empty_schema(),
        }
        return self

    def get(self) -> dict[int | str, dict[str, Any]]:
        schema = self.__schema
        self.__schema = {}
        return schema

    def __empty_schema(self) -> dict[str, Any]:
        return {"application/json": {"example": {}}}

    def __make_schema_recursive(self, value: Any) -> Any:
        if isinstance(value, type) and issubclass(value, Enum):
            return f"Literal[{', '.join([enum_value.value for enum_value in value])}]"

        if isinstance(value, type) and issubclass(value, BaseSqlModel):
            return self.__make_schema_recursive(value.api_schema())

        if isinstance(value, dict):
            new_dict: dict[str, Any] = {}
            for key, dict_value in value.items():
                if isinstance(key, type) and issubclass(key, Enum):
                    new_dict[self.__make_schema_recursive(key)] = self.__make_schema_recursive(dict_value)
                else:
                    new_dict[cast(str, key)] = self.__make_schema_recursive(dict_value)
            return new_dict

        if (
            isinstance(value, tuple)
            and len(value) == 2
            and isinstance(value[0], type)
            and issubclass(value[0], BaseSqlModel)
        ):
            if isinstance(value[1], tuple):
                return self.__make_schema_recursive(value[0].api_schema(*value[1]))
            else:
                return self.__make_schema_recursive(value[0].api_schema(**value[1]))

        if isinstance(value, list):
            new_list: list = []
            for list_value in value:
                new_list.append(self.__make_schema_recursive(list_value))
            return new_list

        return value
