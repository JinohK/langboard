from typing import Annotated
from fastapi import File, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse
from ...core.db import DbSession
from ...core.routing import AppRouter
from ...models import User
from .scopes.SignUp import SignUpForm


@AppRouter.api.get("/auth/signup", response_class=HTMLResponse)
def signup_form() -> str:
    return """
    <script type="text/javascript">
    function send() {
        var form = document.querySelector("form");
        var formData = new FormData(form);
        fetch("/auth/signup", {
            method: "POST",
            body: formData
        });
    }
    </script>
    <form>
    <input type="text" name="name" /><br>
    <input type="email" name="email" /><br>
    <input type="password" name="password" /><br>
    <input type="text" name="industry" /><br>
    <input type="text" name="purpose" /><br>
    <input type="text" name="affiliation" /><br>
    <input type="text" name="position" /><br>
    <input type="file" name="avatar" /><br>
    <input type="button" onclick="send()" />
    </form>
"""


@AppRouter.api.get("/auth/signup/email")
def exists_email(email: str, db: DbSession = DbSession.scope()):
    user = db.exec(db.build_select(User).where(User.email == email)).first()
    return JSONResponse(content={"exists": isinstance(user, User)})


@AppRouter.api.post("/auth/signup")
async def signup(form: Annotated[SignUpForm, SignUpForm.scope()], avatar: UploadFile | None = File(None)):
    return JSONResponse(content={})
