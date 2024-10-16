from typing import Annotated
from fastapi import Header, status
from fastapi.responses import JSONResponse
from jwt import ExpiredSignatureError
from ...core.filter import AuthFilter
from ...core.routing import AppRouter
from ...core.security import Auth
from ...core.utils.Encryptor import Encryptor
from ...models import User
from ...services import Service
from .scopes import AuthEmailForm, AuthEmailResponse, RefreshResponse, SignInForm, SignInResponse


@AppRouter.api.post("/auth/email", response_model=AuthEmailResponse)
async def auth_email(form: AuthEmailForm, service: Service = Service.scope()) -> JSONResponse | AuthEmailResponse:
    if form.is_token:
        email = Encryptor.decrypt(form.token, form.sign_token)  # type: ignore
    else:
        email = form.email

    user = await service.user.get_user_by_email(email)

    if not user:
        return JSONResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    token = Encryptor.encrypt(user.email, form.sign_token)
    return AuthEmailResponse(token=token, email=user.email)


@AppRouter.api.post("/auth/signin", response_model=SignInResponse)
async def sign_in(form: SignInForm, service: Service = Service.scope()) -> JSONResponse | SignInResponse:
    decrypted_email = Encryptor.decrypt(form.email_token, form.sign_token)
    user = await service.user.get_user_by_email(decrypted_email)

    if not user:
        return JSONResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    if not user.check_password(form.password):
        return JSONResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    access_token, refresh_token = Auth.authenticate(user.id)  # type: ignore

    return SignInResponse(access_token=access_token, refresh_token=refresh_token)


@AppRouter.api.post("/auth/refresh", response_model=RefreshResponse)
async def refresh(refresh_token: Annotated[str, Header()]) -> JSONResponse | RefreshResponse:
    try:
        new_access_token = Auth.refresh(refresh_token)
        user = await Auth.get_user_by_token(new_access_token)

        if not user:
            raise Exception()
    except ExpiredSignatureError:
        return JSONResponse(content={}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except Exception:
        return JSONResponse(content={}, status_code=status.HTTP_401_UNAUTHORIZED)

    return RefreshResponse(access_token=new_access_token)


@AppRouter.api.get("/auth/me")
@AuthFilter.add
def about_me(user: User = Auth.scope("api")) -> JSONResponse:
    response = user.model_dump()
    response.pop("password")
    response.pop("deleted_at")
    response.pop("updated_at")

    if user.avatar:
        response["avatar"] = user.avatar.path

    return JSONResponse(content={"user": response})
