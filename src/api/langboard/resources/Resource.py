from pathlib import Path
from typing import Literal
from ..Constants import ROOT_DIR


TResourceName = Literal["locales"]


def get_resource_path(resource_name: TResourceName, path: str | Path | None = None) -> Path:  # type: ignore
    resource_dir = ROOT_DIR / "src" / "resources" / resource_name
    return (resource_dir / path) if path else resource_dir
