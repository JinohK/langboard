from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, Literal, overload
from urllib.parse import urlparse
from sqlmodel import desc
from ...Constants import COMMON_SECRET_KEY
from ...core.caching import Cache
from ...core.security import Auth
from ...core.storage import FileModel
from ...core.utils.DateTime import now
from ...core.utils.Encryptor import Encryptor
from ...core.utils.String import concat, generate_random_string
from ...models import Group, GroupAssignedUser, Project, ProjectAssignedUser, User, UserEmail
from ...models.RevertableRecord import RevertType
from ..BaseService import BaseService
from .RevertService import RevertService


class UserService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user"

    def create_cache_name(self, cache_type: str, email: str) -> str:
        return f"{cache_type}:{email}"

    async def get_by_id(self, user_id: int | None) -> User | None:
        return await self.__get("id", user_id)

    async def get_by_email(self, email: str | None) -> tuple[User, UserEmail | None] | tuple[None, None]:
        return await self.__get("email", email)

    async def get_by_token(
        self, token: str | None, key: str | None
    ) -> tuple[User, UserEmail | None] | tuple[None, None]:
        if not token or not key:
            return None, None
        email = Encryptor.decrypt(token, key)
        return await self.get_by_email(email)

    async def get_all_by_ids(self, user_ids: list[int]) -> list[User]:
        sql_query = self._db.query("select").table(User)
        if len(user_ids) > 1:
            sql_query = sql_query.where(User.column("id").in_(user_ids))
        else:
            sql_query = sql_query.where(User.column("id") == user_ids[0])
        result = await self._db.exec(sql_query)
        return list(result.all())

    async def create(self, form: dict, avatar: FileModel | None = None) -> User:
        user = User(**form)
        user.avatar = avatar

        self._db.insert(user)
        await self._db.commit()
        return user

    async def create_subemail(self, user_id: int, email: str) -> UserEmail:
        user_email = UserEmail(user_id=user_id, email=email)
        self._db.insert(user_email)
        await self._db.commit()
        return user_email

    async def get_subemails(self, user: User) -> list[dict[str, Any]]:
        if not user.id:
            return []
        result = await self._db.exec(self._db.query("select").table(UserEmail).where(UserEmail.user_id == user.id))
        raw_subemails = result.all()
        subemails = []
        for subemail in raw_subemails:
            subemails.append(
                {
                    "email": subemail.email,
                    "verified_at": subemail.verified_at,
                }
            )
        return subemails

    async def get_assigned_group_names(self, user: User) -> list[str]:
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

    async def get_starred_projects(self, user: User) -> list[dict[str, str]]:
        if not user or user.is_new():
            return []

        result = await self._db.exec(
            self._db.query("select")
            .columns(
                Project.uid,
                Project.title,
                Project.project_type,
            )
            .join(ProjectAssignedUser, ProjectAssignedUser.project_id == Project.id)  # type: ignore
            .where(ProjectAssignedUser.user_id == user.id)
            .where(ProjectAssignedUser.starred == True)  # noqa
            .order_by(desc(ProjectAssignedUser.last_viewed_at), desc(Project.updated_at), desc(Project.id))
        )
        raw_projects = result.all()

        projects = []

        for uid, title, project_type in raw_projects:
            projects.append(
                {
                    "uid": uid,
                    "title": title,
                    "project_type": project_type,
                }
            )
        return projects

    async def create_token_url(
        self, user: User, cache_key: str, url: str, token_query_name: str, extra_token_data: dict | None = None
    ) -> str:
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

        user = await self.get_by_id(token_info["id"])
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
        await self._db.update(user)
        await self._db.commit()

    async def verify_subemail(self, subemail: UserEmail) -> None:
        subemail.verified_at = now()
        await self._db.update(subemail)
        await self._db.commit()

    async def update(self, user: User, form: dict) -> str:
        for key, value in form.items():
            if key == "id":
                continue

            if hasattr(user, key):
                setattr(user, key, value)

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(
                unsaved_model=user, revert_type=RevertType.Update, file_columns=["avatar"]
            )
        )
        await Auth.reset_user(user)
        return revert_key

    async def change_primary_email(self, user: User, subemail: UserEmail) -> str:
        user_email = user.email
        user.email = subemail.email
        subemail.email = user_email

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(
                unsaved_model=user, revert_type=RevertType.Update, file_columns=["avatar"]
            ),
            revert_service.create_record_model(unsaved_model=subemail, revert_type=RevertType.Update),
        )
        await Auth.reset_user(user)
        return revert_key

    async def delete_email(self, subemail: UserEmail) -> str:
        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(unsaved_model=subemail, revert_type=RevertType.Insert)
        )
        return revert_key

    async def change_password(self, user: User, password: str) -> None:
        user.set_password(password)
        await self._db.update(user)
        await self._db.commit()

    @overload
    async def __get(
        self, column: Literal["email"], value: Any
    ) -> tuple[User, UserEmail | None] | tuple[None, None]: ...
    @overload
    async def __get(self, column: str, value: Any) -> User | None: ...
    async def __get(self, column: str, value: Any) -> User | None | tuple[User, UserEmail | None] | tuple[None, None]:
        if not value:
            return None
        result = await self._db.exec(self._db.query("select").table(User).where(User.column(column) == value))
        user = result.first()
        if column != "email":
            return user
        if user:
            return user, None
        result = await self._db.exec(
            self._db.query("select")
            .tables(User, UserEmail)
            .join(
                UserEmail,
                (User.column("id") == UserEmail.column("user_id")) & (UserEmail.column("deleted_at") == None),  # noqa
            )
            .where(UserEmail.column("email") == value)
        )
        return result.first() or (None, None)
