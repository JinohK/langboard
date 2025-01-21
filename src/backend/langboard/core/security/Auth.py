from calendar import timegm
from datetime import timedelta
from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, Literal
from fastapi import Depends, FastAPI, Request, status
from fastapi.openapi.utils import get_openapi
from jwt import ExpiredSignatureError, InvalidTokenError
from jwt import decode as jwt_decode
from jwt import encode as jwt_encode
from pkg_resources import require
from starlette.datastructures import Headers
from ...Constants import JWT_ALGORITHM, JWT_AT_EXPIRATION, JWT_RT_EXPIRATION, JWT_SECRET_KEY, PROJECT_NAME
from ..caching import Cache
from ..db import DbSession, SnowflakeID, SqlBuilder, User
from ..filter import AuthFilter
from ..routing.AppExceptionHandlingRoute import AppExceptionHandlingRoute
from ..routing.SocketRequest import SocketRequest
from ..utils.DateTime import now
from ..utils.decorators import staticclass
from ..utils.Encryptor import Encryptor


@staticclass
class Auth:
    @staticmethod
    def authenticate(user_id: SnowflakeID) -> tuple[str, str]:
        """Authenticates the user and returns the access and refresh tokens.

        :param user_id: The user ID.
        """
        access_token = Auth._create_access_token(user_id)
        refresh_token = Auth._create_refresh_token(user_id)

        return access_token, refresh_token

    @staticmethod
    def refresh(token: str) -> str:
        """Refreshes the access token using the refresh token.

        :param token: The refresh token.

        :raises InvalidTokenError: If the token is invalid.
        :raises ExpiredSignatureError: If the signature has expired.
        """
        try:
            payload = json_loads(Encryptor.decrypt(token, JWT_SECRET_KEY))
            expiry = int(payload["exp"])
        except Exception:
            raise InvalidTokenError("Invalid token")
        current = now().timestamp()

        if expiry <= current:
            raise ExpiredSignatureError("Signature has expired")

        access_token = Auth._create_access_token(payload["sub"])
        return access_token

    @staticmethod
    def scope(where: Literal["api", "socket"]) -> User:
        """Creates a scope for the user to be used in :class:`fastapi.FastAPI` endpoints."""
        if where == "api":

            def get_user(req: Request) -> User | None:  # type: ignore
                return req.user

        elif where == "socket":

            async def get_user(req: SocketRequest) -> User | None:
                user = await Auth.get_user_by_id(req.from_app["auth_user_id"])
                return user  # type: ignore

        else:
            raise ValueError("Auth.scope must be called with either 'api' or 'socket'")

        return Depends(get_user)

    @staticmethod
    async def get_user_by_token(token: str) -> User | InvalidTokenError | ExpiredSignatureError | None:
        """Gets the user from the given token.

        :param token: The token to get the user from.

        :return User: The user if the token is valid.
        :return InvalidTokenError: If the token is invalid.
        :return ExpiredSignatureError: If the signature has expired.
        :return None: If the user could not be found.
        """
        try:
            payload = jwt_decode(jwt=token, key=JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            if int(payload["exp"]) <= timegm(now().utctimetuple()):
                raise ExpiredSignatureError("Signature has expired")
        except ExpiredSignatureError as e:
            return e
        except Exception:
            return InvalidTokenError("Invalid token")

        try:
            user_id = int(payload["sub"])
            if user_id <= 0:
                raise Exception()
        except Exception:
            return InvalidTokenError("Invalid token")

        return await Auth.get_user_by_id(user_id)

    @staticmethod
    async def get_user_by_id(user_id: int) -> User | InvalidTokenError | None:
        """Gets the user from the given ID.

        If the user is cached, it will return the cached user.

        Otherwise, it will get the user from the database.

        :param user_id: The user ID to get the user from.

        :return User: The user if the user exists.
        :return None: If the user does not exist.
        """
        cache_key = f"auth-user-{user_id}"
        cached_user = await Cache.get(cache_key, User.model_validate)
        if cached_user:
            return cached_user

        try:
            async with DbSession.use_db() as db:
                result = await db.exec(SqlBuilder.select.table(User).where(User.id == user_id).limit(1))
            user = result.first()

            if not user:
                return InvalidTokenError("Invalid token")

            await Cache.set(cache_key, user, 60 * 5)

            return user
        except Exception:
            return None

    @staticmethod
    async def reset_user(user: User) -> None:
        """Resets the user cache.

        :param user: The user to reset.
        """
        if user.is_new():
            return

        cache_key = f"auth-user-{user.id}"
        await Cache.delete(cache_key)

        await Cache.set(cache_key, user, 60 * 5)

    @staticmethod
    async def validate(queries_headers: dict[Any, Any] | Headers) -> User | Literal[401, 422]:
        """Validates the given headers or queries and returns the user if the token is valid.

        :param headers: The headers to validate.

        :return User: The user if the token is valid.
        :return 401: If the token is invalid. :class:`fastapi.status.HTTP_401_UNAUTHORIZED`
        :return 422: If the signature has expired. :class:`fastapi.status.HTTP_422_UNPROCESSABLE_ENTITY`
        """
        authorization = queries_headers.get("Authorization", queries_headers.get("authorization", None))
        if not authorization:
            return status.HTTP_401_UNAUTHORIZED

        if isinstance(queries_headers, Headers):
            access_token_scheme, access_token = authorization.split(" ")
            if access_token_scheme.lower() != "bearer":
                return status.HTTP_401_UNAUTHORIZED
        elif isinstance(authorization, list):
            if len(authorization) < 1:
                return status.HTTP_401_UNAUTHORIZED
            access_token = authorization[0]
        else:
            if authorization.startswith("Bearer "):
                access_token = authorization.split("Bearer ")[1]
            elif authorization.startswith("bearer "):
                access_token = authorization.split("bearer ")[1]
            else:
                access_token = authorization

        user = await Auth.get_user_by_token(access_token)
        if isinstance(user, User):
            return user
        elif isinstance(user, ExpiredSignatureError):
            return status.HTTP_422_UNPROCESSABLE_ENTITY
        else:
            return status.HTTP_401_UNAUTHORIZED

    @staticmethod
    def get_openai_schema(app: FastAPI) -> dict[str, Any]:
        if app.openapi_schema:
            return app.openapi_schema

        version = require(PROJECT_NAME)[0].version
        openapi_schema = get_openapi(
            title=PROJECT_NAME.capitalize(),
            version=version,
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
                            route_path[i] = part.split(":")[0] + "}"
                    route_path = "/".join(route_path)
                else:
                    route_path = route.path
                path = openapi_schema["paths"][route_path]
                for method in route.methods:
                    path_method = path[method.lower()]
                    path_method["security"] = [{"BearerAuth": []}]

        app.openapi_schema = openapi_schema

        return openapi_schema

    @staticmethod
    def _create_access_token(user_id: int) -> str:
        expiry = now() + timedelta(seconds=JWT_AT_EXPIRATION)
        payload = {"sub": str(user_id), "exp": expiry}
        return jwt_encode(payload=payload, key=JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    @staticmethod
    def _create_refresh_token(user_id: int) -> str:
        expiry = now() + timedelta(days=JWT_RT_EXPIRATION)
        payload = {"sub": str(user_id), "exp": timegm(expiry.utctimetuple())}
        return Encryptor.encrypt(json_dumps(payload), JWT_SECRET_KEY)
