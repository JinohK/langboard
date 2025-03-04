from pathlib import Path
from typing import Literal
from ..Constants import BASE_DIR


TResourceName = Literal["locales"]


def get_resource_path(resource_name: TResourceName, path: str | Path | None = None) -> Path:  # type: ignore
    resource_dir = BASE_DIR / "resources" / resource_name
    return (resource_dir / path) if path else resource_dir
