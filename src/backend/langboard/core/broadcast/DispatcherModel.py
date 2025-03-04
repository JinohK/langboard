from typing import Any
from pydantic import BaseModel
from ...Constants import DATA_DIR
from ..utils.DateTime import now
from ..utils.String import create_short_unique_id


class DispatcherModel(BaseModel):
    event: str
    data: dict


def record_model(event: str | DispatcherModel, data: dict[str, Any] | None = None):
    now_str = str(now().timestamp()).replace(".", "_")
    random_str = create_short_unique_id(10)
    name = f"{now_str}-{random_str}.json"
    dir_path = DATA_DIR / "broadcast"
    dir_path.mkdir(parents=True, exist_ok=True)
    file_path = dir_path / name

    with open(file_path, "w", encoding="utf-8") as file:
        if isinstance(event, str):
            model = DispatcherModel(event=event, data=data or {})
        else:
            model = event
        file.write(model.model_dump_json())
        file.close()

    return name


def load_model(name: str):
    file_path = DATA_DIR / "broadcast" / name

    if not file_path.exists():
        return None

    with open(file_path, "r", encoding="utf-8") as file:
        json = file.read().strip()
        file.close()

    file_path.unlink(missing_ok=True)

    try:
        model = DispatcherModel.model_validate_json(json)
        return model
    except Exception:
        return None
