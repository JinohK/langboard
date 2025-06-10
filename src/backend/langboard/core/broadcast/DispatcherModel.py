from typing import Any
from pydantic import BaseModel
from ...Constants import CACHE_TYPE, DATA_DIR
from ..caching import Cache
from ..db import SnowflakeID
from ..utils.DateTime import now
from ..utils.String import create_short_unique_id


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
    now_str = str(now().timestamp()).replace(".", "_")
    random_str = create_short_unique_id(10)

    model = DispatcherModel(event=event, data=data or {}) if isinstance(event, str) else event

    if CACHE_TYPE == "redis":
        cache_key = f"broadcast-{now_str}-{random_str}"
        await Cache.set(cache_key, model.model_dump()["data"], 3 * 60)
        return cache_key

    name = f"{now_str}-{random_str}.json" if not file_only else f"{now_str}-{random_str}-fileonly.json"
    file_path = BROADCAST_DIR / name

    with open(file_path, "w", encoding="utf-8") as file:
        file.write(model.model_dump_json())
        file.close()

    return name
