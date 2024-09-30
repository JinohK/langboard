from typing import Annotated
from fastapi.responses import JSONResponse
from sqlmodel import select
from ...core.db import DbSession
from ...core.routing import AppRouter
from ...core.utils.Encryptor import Encryptor
from ...models.User import User
from .CheckEmailForm import CheckEmailForm


@AppRouter.api.post("/auth/check/email")
async def check_email(form: CheckEmailForm, db: Annotated[DbSession, DbSession.scope()]) -> JSONResponse:
    if form.is_token:
        decrypted_email = Encryptor.decrypt(form.token, form.login_token)
        user = db.exec(select(User).where(User.email == decrypted_email)).first()
    else:
        user = db.exec(select(User).where(User.email == form.email)).first()

    if not user:
        return JSONResponse(content={"status": False})

    token = Encryptor.encrypt(user.email, form.login_token)
    return JSONResponse(content={"status": True, "token": token})
