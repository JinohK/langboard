from calendar import timegm
from datetime import timedelta
from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from jwt import ExpiredSignatureError, InvalidTokenError
from jwt import decode as jwt_decode
from jwt import encode as jwt_encode
from ...Constants import (
    JWT_ALGORITHM,
    JWT_AT_EXPIRATION,
    JWT_RT_EXPIRATION,
    JWT_SECRET_KEY,
    PROJECT_NAME,
    PROJECT_VERSION,
)
from ..db import SnowflakeID
from ..filter import AuthFilter
from ..routing.AppExceptionHandlingRoute import AppExceptionHandlingRoute
from ..utils.DateTime import now
from ..utils.decorators import staticclass
from ..utils.Encryptor import Encryptor


@staticclass
class AuthSecurity:
    AUTHORIZATION_HEADER = "Authorization"
    IP_HEADER = "X-Forwarded-For"
    API_TOKEN_HEADER = "X-Api-Token"

    @staticmethod
    def authenticate(user_id: SnowflakeID) -> tuple[str, str]:
        """Authenticates the user and returns the access and refresh tokens.

        :param user_id: The user ID.
        """
        access_token = AuthSecurity.create_access_token(user_id)
        refresh_token = AuthSecurity.create_refresh_token(user_id)

        return access_token, refresh_token

    @staticmethod
    def refresh(token: str) -> str:
        """Refreshes the access token using the refresh token.

        :param token: The refresh token.

        :raises InvalidTokenError: If the token is invalid.
        :raises ExpiredSignatureError: If the signature has expired.
        """
        try:
            payload = AuthSecurity.decode_refresh_token(token)
        except ExpiredSignatureError as e:
            raise e
        except Exception:
            raise InvalidTokenError("Invalid token")

        access_token = AuthSecurity.create_access_token(payload["sub"])
        return access_token

    @staticmethod
    def set_openapi_schema(app: FastAPI):
        if app.openapi_schema:
            openapi_schema = app.openapi_schema
        else:
            openapi_schema = get_openapi(
                title=PROJECT_NAME.capitalize(),
                version=PROJECT_VERSION,
                routes=app.routes,
            )

        if "components" not in openapi_schema:
            openapi_schema["components"] = {}

        if "securitySchemes" not in openapi_schema["components"]:
            openapi_schema["components"]["securitySchemes"] = {}

        auth_schema = {
            "type": "http",
            "scheme": "bearer",
        }

        openapi_schema["components"]["securitySchemes"]["BearerAuth"] = auth_schema

        for route in app.routes:
            if not isinstance(route, AppExceptionHandlingRoute):
                continue
            if AuthFilter.exists(route.endpoint):
                if route.path.count(":") > 0:
                    route_path = route.path.split("/")
                    for i, part in enumerate(route_path):
                        if part.count(":") > 0:
                            route_path[i] = part.split(":", maxsplit=1)[0] + "}"
                    route_path = "/".join(route_path)
                else:
                    route_path = route.path
                path = openapi_schema["paths"][route_path]
                for method in route.methods:
                    path_method = path[method.lower()]
                    path_method["security"] = [{"BearerAuth": []}]

        app.openapi_schema = openapi_schema

    @staticmethod
    def create_access_token(user_id: int) -> str:
        expiry = now() + timedelta(seconds=JWT_AT_EXPIRATION)
        payload = {"sub": str(user_id), "exp": expiry, "iss": PROJECT_NAME}
        return jwt_encode(payload=payload, key=JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    @staticmethod
    def create_refresh_token(user_id: int) -> str:
        expiry = now() + timedelta(days=JWT_RT_EXPIRATION)
        payload = {"sub": str(user_id), "exp": timegm(expiry.utctimetuple()), "iss": PROJECT_NAME}
        return Encryptor.encrypt(json_dumps(payload), JWT_SECRET_KEY)

    @staticmethod
    def compare_tokens(access_token: str | None, refresh_token: str | None) -> bool:
        if not access_token or not refresh_token:
            return False
        try:
            access_payload = AuthSecurity.decode_access_token(access_token)
            refresh_payload = AuthSecurity.decode_refresh_token(refresh_token)
            return access_payload["sub"] == refresh_payload["sub"] and access_payload["iss"] == refresh_payload["iss"]
        except Exception:
            return False

    @staticmethod
    def decode_access_token(token: str) -> dict[str, Any]:
        payload = jwt_decode(jwt=token, key=JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], issuer=PROJECT_NAME)
        if not isinstance(payload, dict):
            raise InvalidTokenError("Invalid token")
        if "sub" not in payload or "iss" not in payload or "exp" not in payload:
            raise InvalidTokenError("Invalid token structure")
        if payload["iss"] != PROJECT_NAME or not isinstance(payload["sub"], str) or not isinstance(payload["exp"], int):
            raise InvalidTokenError("Invalid token structure")
        if int(payload["exp"]) <= timegm(now().utctimetuple()):
            raise ExpiredSignatureError("Signature has expired")
        return payload

    @staticmethod
    def decode_refresh_token(token: str) -> dict[str, Any]:
        payload = json_loads(Encryptor.decrypt(token, JWT_SECRET_KEY))
        if not isinstance(payload, dict):
            raise InvalidTokenError("Invalid token")
        if "sub" not in payload or "iss" not in payload or "exp" not in payload:
            raise InvalidTokenError("Invalid token structure")
        if payload["iss"] != PROJECT_NAME or not isinstance(payload["sub"], str) or not isinstance(payload["exp"], int):
            raise InvalidTokenError("Invalid token structure")
        if payload["exp"] <= timegm(now().utctimetuple()):
            raise ExpiredSignatureError("Signature has expired")
        return payload
