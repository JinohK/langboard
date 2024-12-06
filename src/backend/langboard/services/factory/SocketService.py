from typing import Any, Callable, TypeVar, cast, overload
from ...core.caching import Cache
from ...core.utils.String import generate_random_string
from ..BaseService import BaseService


_TModel = TypeVar("_TModel")


class SocketService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "socket"

    async def create_model_id(self, cachable_data: Any) -> str:
        model_id = self.__create_id()
        await Cache.set(model_id, cachable_data, ttl=300)
        return model_id

    @overload
    async def get_model(self, model_id: str) -> Any | None: ...
    @overload
    async def get_model(self, model_id: str, caster: Callable[[Any], _TModel]) -> _TModel | None: ...
    async def get_model(self, model_id: str, caster: Callable[[Any], _TModel] | None = None) -> Any | _TModel | None:
        result = await Cache.get(model_id, cast(Callable[[Any], _TModel], caster))
        await Cache.delete(model_id)
        return result

    def __create_id(self) -> str:
        return f"socket:{generate_random_string(16)}"
