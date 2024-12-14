from typing import Any, Callable, TypeVar, cast, overload
from ..caching import Cache
from ..utils.decorators import staticclass
from ..utils.String import generate_random_string


_TModel = TypeVar("_TModel")


@staticclass
class ModelIdService:
    @staticmethod
    async def create_model_id(cachable_data: Any) -> str:
        model_id = ModelIdService.__create_id()
        await Cache.set(model_id, cachable_data, ttl=300)
        return model_id

    @staticmethod
    @overload
    async def get_model(model_id: str) -> Any | None: ...
    @staticmethod
    @overload
    async def get_model(model_id: str, caster: Callable[[Any], _TModel]) -> _TModel | None: ...
    @staticmethod
    async def get_model(model_id: str, caster: Callable[[Any], _TModel] | None = None) -> Any | _TModel | None:
        result = await Cache.get(model_id, cast(Callable[[Any], _TModel], caster))
        await Cache.delete(model_id)
        return result

    @staticmethod
    def __create_id() -> str:
        return f"socket:{generate_random_string(16)}"
