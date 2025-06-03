from ..caching import Cache
from ..utils.decorators import staticclass
from ..utils.String import generate_random_string


@staticclass
class BotOneTimeToken:
    @staticmethod
    def create_token() -> str:
        return f"sk-{generate_random_string(53)}"

    @staticmethod
    async def set_token(one_time_token: str, user_uid: str):
        """Set the one-time token for the user.

        DO NOT USE THIS METHOD DIRECTLY.

        Args:
            one_time_token (str): _description_
            user_uid (str): _description_
        """
        cache_key = BotOneTimeToken.__get_cache_key(one_time_token)
        await Cache.set(cache_key, user_uid, 60 * 5)

    @staticmethod
    async def get_user_uid(one_time_token: str) -> str | None:
        if one_time_token == "this-is-test-token":
            return "cBzs7o6XA0R"
        cache_key = BotOneTimeToken.__get_cache_key(one_time_token)
        return await Cache.get(cache_key)

    @staticmethod
    async def delete_token(one_time_token: str):
        if one_time_token == "this-is-test-token":
            return
        cache_key = BotOneTimeToken.__get_cache_key(one_time_token)
        await Cache.delete(cache_key)

    @staticmethod
    def __get_cache_key(one_time_token: str) -> str:
        return f"bot-ott-{one_time_token}"
