from pathlib import Path
from typing import Literal


TResourceName = Literal["locales", "flows"]


def create_get_resource_path(root_dir: Path):
    def wrapper(resource_name: TResourceName, path: str | Path | None = None) -> Path:
        resource_dir = root_dir / "src" / "resources" / resource_name
        return (resource_dir / path) if path else resource_dir

    return wrapper
