from json import loads as json_loads
from typing import Any
from core.caching import Cache
from core.Env import Env
from core.types import SafeDateTime, SnowflakeID
from core.utils.String import create_short_unique_id
from pydantic import BaseModel
from ...Constants import DATA_DIR


def _convert_id_for_js(v: dict):
    for key, value in v.items():
        if isinstance(value, SnowflakeID):
            v[key] = str(value)
        elif isinstance(value, dict):
            v[key] = _convert_id_for_js(value)
        else:
            v[key] = value

    return v


class DispatcherModel(BaseModel):
    event: str
    data: dict

    class Config:
        json_encoders = {
            dict: _convert_id_for_js,
        }


BROADCAST_DIR = DATA_DIR / "broadcast"
BROADCAST_DIR.mkdir(parents=True, exist_ok=True)


async def record_model(
    event: str | DispatcherModel, data: dict[str, Any] | None = None, file_only: bool = False
) -> str:
    now_str = str(SafeDateTime.now().timestamp()).replace(".", "_")
    random_str = create_short_unique_id(10)

    model = DispatcherModel(event=event, data=data or {}) if isinstance(event, str) else event

    if Env.CACHE_TYPE == "redis":
        cache_key = f"broadcast-{now_str}-{random_str}"
        # Prevent enums from being Enum.Name
        await Cache.set(cache_key, json_loads(model.model_dump_json())["data"], 3 * 60)
        return cache_key

    name = f"{now_str}-{random_str}.json" if not file_only else f"{now_str}-{random_str}-fileonly.json"
    file_path = BROADCAST_DIR / name

    with open(file_path, "w", encoding="utf-8") as file:
        file.write(model.model_dump_json())
        file.close()

    return name
