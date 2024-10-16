from ...models import User
from ..BaseService import BaseService


class UserService(BaseService):
    @staticmethod
    def name() -> str:
        return "user"

    async def get_user_by_email(self, email: str | None) -> User | None:
        if not email:
            return None
        result = await self._db.exec(self._db.query("select").table(User).where(User.email == email))
        return result.first()
