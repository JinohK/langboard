from typing import Any, Callable, TypeVar, overload
from ...Constants import CACHE_TYPE
from ..utils.decorators import class_instance, singleton
from .BaseCache import BaseCache
from .InMemoryCache import InMemoryCache
from .RedisCache import RedisCache


_TCastReturn = TypeVar("_TCastReturn")


@class_instance()
@singleton
class Cache(BaseCache):
    def __init__(self):
        if CACHE_TYPE == "redis":
            self._cache: BaseCache = RedisCache()
        else:
            self._cache: BaseCache = InMemoryCache()

    @overload
    async def get(self, key: str) -> Any | None: ...
    @overload
    async def get(self, key: str, cast: Callable[[Any], _TCastReturn]) -> _TCastReturn | None: ...
    async def get(self, key: str, cast: Callable[[Any], _TCastReturn] | None = None) -> Any | None:
        return await self._cache.get(key, cast)

    @overload
    async def set(self, key: str, value: Any) -> None: ...
    @overload
    async def set(self, key: str, value: Any, ttl: int) -> None: ...
    async def set(self, key: str, value: Any, ttl: int = 0) -> None:
        await self._cache.set(key, value, ttl)

    async def delete(self, key: str) -> None:
        await self._cache.delete(key)

    async def clear(self) -> None:
        await self._cache.clear()
