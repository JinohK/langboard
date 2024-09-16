from importlib import import_module
from os import sep
from types import ModuleType
from typing import Type
from .Constants import BASE_DIR
from .core.logger import Logger


logger = Logger.main


def get_exports(namespace: str, module: ModuleType) -> list[Type]:
    """Gets exports from a module."""
    exports = [getattr(module, name) for name in dir(module) if not name.startswith("_")]
    exports_within_module = [
        export for export in exports if hasattr(export, "__module__") and export.__module__ == namespace
    ]
    return exports_within_module


def load_modules(dir_path: str, file_pattern: str) -> dict[str, list[Type]]:
    """Loads modules from a directory."""
    target_dir = BASE_DIR / dir_path
    modules = {}
    for filepath in target_dir.glob(f"**{sep}*{file_pattern}.py"):
        if not filepath.is_file():
            continue
        namespaces = []
        for namespace in filepath.parts[::-1][1:]:
            namespaces.insert(0, namespace)
            if namespace == dir_path:
                break
        namespaces.insert(0, __name__.split(".")[0])
        namespaces.append(filepath.stem)
        namespace = ".".join(namespaces)

        module = import_module(namespace)
        exports = get_exports(namespace, module)
        modules[namespace] = exports
    logger.info(f"Loaded [b green]{file_pattern}[/] modules in [b green]{dir_path}[/]")
    return modules
