from typing import Any, Callable, TypeVar, overload
from redis import Redis
from ...Constants import CACHE_URL
from .BaseCache import BaseCache


_TCastReturn = TypeVar("_TCastReturn")


class RedisCache(BaseCache):
    def __init__(self):
        self._cache = Redis.from_url(CACHE_URL, decode_responses=True)

    @overload
    async def get(self, key: str) -> Any | None: ...
    @overload
    async def get(self, key: str, cast: Callable[[Any], _TCastReturn]) -> _TCastReturn | None: ...
    async def get(self, key: str, cast: Callable[[Any], _TCastReturn] | None = None) -> Any | None:
        raw_value = self._cache.get(key)
        if raw_value is None:
            return None

        value = await self._cast_get(raw_value, cast)
        return value

    async def set(self, key: str, value: Any, ttl: int = 0) -> None:
        casted_value = await self._cast_set(value)
        self._cache.set(key, casted_value, ex=ttl if ttl > 0 else None)

    async def delete(self, key: str) -> None:
        self._cache.delete(key)

    async def clear(self) -> None:
        self._cache.flushdb()
