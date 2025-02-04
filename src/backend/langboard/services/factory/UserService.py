from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, cast
from urllib.parse import urlparse
from ...Constants import COMMON_SECRET_KEY, FRONTEND_REDIRECT_URL, QUERY_NAMES
from ...core.caching import Cache
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.security import Auth
from ...core.service import BaseService
from ...core.storage import FileModel
from ...core.utils.DateTime import now
from ...core.utils.Encryptor import Encryptor
from ...core.utils.String import concat, generate_random_string
from ...locales.LangEnum import LangEnum
from ...models import Project, ProjectAssignedUser, UserEmail, UserProfile
from ...publishers import UserPublisher
from ...tasks.activities import UserActivityTask


class UserService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user"

    def create_cache_name(self, cache_type: str, email: str) -> str:
        return f"{cache_type}:{email}"

    async def get_by_uid(self, uid: str) -> User | None:
        return await self._get_by_param(User, uid)

    async def get_by_email(self, email: str | None) -> tuple[User, UserEmail | None] | tuple[None, None]:
        user = await self._get_by(User, "email", email)
        if user:
            return user, None
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.tables(User, UserEmail)
                .join(
                    UserEmail,
                    (User.column("id") == UserEmail.column("user_id")) & (UserEmail.column("deleted_at") == None),  # noqa
                )
                .where(UserEmail.column("email") == email)
                .limit(1)
            )
        return result.first() or (None, None)

    async def get_by_token(
        self, token: str | None, key: str | None
    ) -> tuple[User, UserEmail | None] | tuple[None, None]:
        if not token or not key:
            return None, None
        email = Encryptor.decrypt(token, key)
        return await self.get_by_email(email)

    async def get_profile(self, user: User) -> UserProfile:
        return cast(UserProfile, await self._get_by(UserProfile, "user_id", user.id))

    async def create(self, form: dict, avatar: FileModel | None = None) -> User:
        user = User(**form)
        user.avatar = avatar

        async with DbSession.use() as db:
            db.insert(user)
            await db.commit()

        user_profile = UserProfile(user_id=user.id, **form)
        async with DbSession.use() as db:
            db.insert(user_profile)
            await db.commit()
        return user

    async def create_subemail(self, user_id: SnowflakeID, email: str) -> UserEmail:
        user_email = UserEmail(user_id=user_id, email=email)
        async with DbSession.use() as db:
            db.insert(user_email)
            await db.commit()
        return user_email

    async def get_subemails(self, user: User) -> list[dict[str, Any]]:
        if not user.id:
            return []
        raw_subemails = await self._get_all_by(UserEmail, "user_id", user.id)
        subemails = [subemail.api_response() for subemail in raw_subemails]
        return subemails

    async def get_starred_projects(self, user: User) -> list[dict[str, str]]:
        if not user or user.is_new():
            return []

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(Project)
                .join(ProjectAssignedUser, ProjectAssignedUser.column("project_id") == Project.column("id"))
                .where(ProjectAssignedUser.column("user_id") == user.id)
                .where(ProjectAssignedUser.column("starred") == True)  # noqa
                .order_by(
                    ProjectAssignedUser.column("last_viewed_at").desc(),
                    Project.column("updated_at").desc(),
                    Project.column("id").desc(),
                )
                .group_by(
                    Project.column("id"),
                    ProjectAssignedUser.column("id"),
                    Project.column("updated_at"),
                    ProjectAssignedUser.column("last_viewed_at"),
                )
            )
        raw_projects = result.all()
        projects = [project.api_response() for project in raw_projects]

        return projects

    async def create_token_url(
        self, user: User, cache_key: str, token_query_name: QUERY_NAMES, extra_token_data: dict | None = None
    ) -> str:
        token = generate_random_string(32)
        token_expire_hours = 24
        token_data = json_dumps({"token": token, "id": user.id})
        encrypted_token = Encryptor.encrypt(token_data, COMMON_SECRET_KEY)

        url_chunks = urlparse(FRONTEND_REDIRECT_URL)
        token_url = url_chunks._replace(
            query=concat(
                url_chunks.query,
                "&" if url_chunks.query else "",
                token_query_name.value,
                "=",
                encrypted_token,
            )
        ).geturl()

        cache_token_Data = {"token": token, "id": user.id}
        if extra_token_data:
            cache_token_Data["extra"] = extra_token_data

        await Cache.set(cache_key, cache_token_Data, 60 * 60 * token_expire_hours)

        return token_url

    async def validate_token_from_url(
        self, token_type: str, token: str
    ) -> tuple[User, str, dict | None] | tuple[None, None, None]:
        try:
            token_info = json_loads(Encryptor.decrypt(token, COMMON_SECRET_KEY))
            if not token_info or "token" not in token_info or "id" not in token_info:
                raise Exception()
        except Exception:
            return None, None, None

        user = await self._get_by(User, "id", token_info["id"])
        if not user:
            return None, None, None

        cache_key = self.create_cache_name(token_type, user.email)

        cached_token_info = await Cache.get(cache_key)
        if (
            not cached_token_info
            or cached_token_info["id"] != user.id
            or cached_token_info["token"] != token_info["token"]
        ):
            return None, None, None

        return user, cache_key, cached_token_info.get("extra")

    async def activate(self, user: User) -> None:
        user.activated_at = now()
        async with DbSession.use() as db:
            await db.update(user)
            await db.commit()

        UserActivityTask.activated(user)

    async def verify_subemail(self, subemail: UserEmail) -> None:
        subemail.verified_at = now()
        async with DbSession.use() as db:
            await db.update(subemail)
            await db.commit()

    async def update(self, user: User, form: dict) -> bool:
        profile = await self.get_profile(user)
        mutable_keys = ["firstname", "lastname", "avatar"]
        profile_mutable_keys = ["affiliation", "position"]

        old_user_record = {}

        for key in mutable_keys:
            if key not in form or not hasattr(user, key):
                continue
            old_value = getattr(user, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_user_record[key] = self._convert_to_python(old_value)
            setattr(user, key, new_value)

        for key in profile_mutable_keys:
            if key not in form or not hasattr(profile, key):
                continue
            old_value = getattr(profile, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_user_record[key] = self._convert_to_python(old_value)
            setattr(profile, key, new_value)

        if "delete_avatar" in form and form["delete_avatar"]:
            old_user_record["avatar"] = self._convert_to_python(user.avatar)
            user.avatar = None

        if not old_user_record:
            return True

        async with DbSession.use() as db:
            await db.update(user)
            await db.update(profile)
            await db.commit()
        await Auth.reset_user(user)

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_user_record:
                continue
            if key == "avatar":
                model[key] = user.avatar.path if user.avatar else None
            else:
                model[key] = self._convert_to_python(getattr(user, key))

        UserPublisher.updated(user, model)

        return True

    async def update_preferred_lang(self, user: User, lang: str):
        if lang in LangEnum.__members__:
            lang = LangEnum[lang].value
        elif lang in LangEnum._value2member_map_:
            lang = lang
        else:
            return False

        user.preferred_lang = lang
        async with DbSession.use() as db:
            await db.update(user)
            await db.commit()

        return True

    async def change_primary_email(self, user: User, subemail: UserEmail) -> bool:
        user_email = user.email
        user.email = subemail.email
        subemail.email = user_email

        async with DbSession.use() as db:
            await db.update(user)
            await db.update(subemail)
            await db.commit()
        await Auth.reset_user(user)

        model = {"email": user.email}
        UserPublisher.updated(user, model)

        return True

    async def delete_email(self, subemail: UserEmail) -> bool:
        async with DbSession.use() as db:
            await db.delete(subemail)
            await db.commit()
        return True

    async def change_password(self, user: User, password: str) -> None:
        user.set_password(password)
        async with DbSession.use() as db:
            await db.update(user)
            await db.commit()
