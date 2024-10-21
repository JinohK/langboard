from datetime import datetime
from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from urllib.parse import urlparse
from ...Constants import COMMON_SECRET_KEY
from ...core.caching import Cache
from ...core.storage import FileModel
from ...core.utils.Encryptor import Encryptor
from ...core.utils.String import concat, generate_random_string
from ...models import Group, GroupAssignedUser, User
from ..BaseService import BaseService


class UserService(BaseService):
    @staticmethod
    def name() -> str:
        return "user"

    def create_cache_name(self, cache_type: str, email: str) -> str:
        return f"{cache_type}:{email}"

    async def get_user_by_id(self, user_id: int | None) -> User | None:
        return await self.__get_user("id", user_id)

    async def get_user_by_email(self, email: str | None) -> User | None:
        return await self.__get_user("email", email)

    async def get_user_by_token(self, token: str | None, key: str | None) -> User | None:
        if not token or not key:
            return None
        email = Encryptor.decrypt(token, key)
        user = await self.get_user_by_email(email)
        return user

    async def get_user_group_names(self, user: User) -> list[str]:
        if not user or user.is_new():
            return []

        result = await self._db.exec(
            self._db.query("select")
            .column(Group.name)
            .join(GroupAssignedUser, GroupAssignedUser.group_id == Group.id)  # type: ignore
            .where(GroupAssignedUser.user_id == user.id)
        )

        group_names = result.all()

        return [group_name for group_name in group_names]

    async def create_token_url(self, user: User, cache_key: str, url: str, token_query_name: str) -> str:
        token = generate_random_string(32)
        token_expire_hours = 24
        token_data = json_dumps({"token": token, "id": user.id})
        encrypted_token = Encryptor.encrypt(token_data, COMMON_SECRET_KEY)

        url_chunks = urlparse(url)
        token_url = url_chunks._replace(
            query=concat(
                url_chunks.query,
                "&" if url_chunks.query else "",
                token_query_name,
                "=",
                encrypted_token,
            )
        ).geturl()

        await Cache.set(cache_key, {"token": token, "id": user.id}, 60 * 60 * token_expire_hours)

        return token_url

    async def validate_token_from_url(self, token_type: str, token: str) -> tuple[User, str] | tuple[None, None]:
        try:
            token_info = json_loads(Encryptor.decrypt(token, COMMON_SECRET_KEY))
            if not token_info or "token" not in token_info or "id" not in token_info:
                raise Exception()
        except Exception:
            return None, None

        user = await self.get_user_by_id(token_info["id"])
        if not user:
            return None, None

        cache_key = self.create_cache_name(token_type, user.email)

        cached_token_info = await Cache.get(cache_key)
        if (
            not cached_token_info
            or cached_token_info["id"] != user.id
            or cached_token_info["token"] != token_info["token"]
        ):
            return None, None

        return user, cache_key

    async def activate_user(self, user: User, commit: bool = True) -> None:
        user.activated_at = datetime.now()
        await self._db.update(user)
        if commit:
            await self._db.commit()

    async def reset_password(self, user: User, password: str, commit: bool = True) -> None:
        user.set_password(password)
        await self._db.update(user)
        if commit:
            await self._db.commit()

    async def create_user(self, form: dict, avatar: FileModel | None = None, commit: bool = True) -> User:
        user = User(**form)
        user.avatar = avatar

        self._db.insert(user)
        if commit:
            await self._db.commit()
        return user

    async def __get_user(self, column: str, value: Any) -> User | None:
        if not value:
            return None
        result = await self._db.exec(self._db.query("select").table(User).where(User.column(column) == value))
        return result.first()
