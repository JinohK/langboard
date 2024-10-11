from datetime import datetime, timedelta
from typing import Any, Callable, TypeVar, overload
from .BaseCache import BaseCache


_TValue = tuple[Any, int]
_TCastReturn = TypeVar("_TCastReturn")


class InMemoryCache(BaseCache):
    def __init__(self):
        self._cache: dict[str, _TValue] = {}

    @overload
    async def get(self, key: str) -> Any | None: ...
    @overload
    async def get(self, key: str, cast: Callable[[Any], _TCastReturn]) -> _TCastReturn | None: ...
    async def get(self, key: str, cast: Callable[[Any], _TCastReturn] | None = None) -> Any | None:
        await self._expire()
        raw_value, ttl = self._cache.get(key, (None, None))
        if raw_value is None or ttl is None:
            return None

        value = await self._cast_get(raw_value, cast)
        return value

    async def set(self, key: str, value: Any, ttl: int = 0) -> None:
        await self._expire()
        expiry = int((datetime.now() + timedelta(seconds=ttl)).timestamp())
        casted_value = await self._cast_set(value)
        self._cache[key] = (casted_value, expiry)

    async def delete(self, key: str) -> None:
        await self._expire()
        if key in self._cache:
            del self._cache[key]

    async def clear(self) -> None:
        self._cache.clear()

    async def _expire(self) -> None:
        for key, (_, ttl) in self._cache.items():
            if ttl <= int(datetime.now().timestamp()):
                del self._cache[key]
