from importlib import import_module
from os import sep
from pkgutil import walk_packages
from types import ModuleType
from typing import Type, TypeVar
from .Constants import BASE_DIR, IS_BUNDLE
from .core.logger import Logger


_TBase = TypeVar("_TBase", bound=Type)


def get_exports(namespace: str, module: ModuleType) -> list[Type]:
    """Gets exports from a module."""
    exports = [getattr(module, name) for name in dir(module) if not name.startswith("_")]
    exports_within_module = [
        export for export in exports if hasattr(export, "__module__") and export.__module__ == namespace
    ]
    return exports_within_module


def load_modules(  # type: ignore
    dir_path: str, file_pattern: str, base_type: _TBase = Type, log: bool = True
) -> dict[str, list[_TBase]]:
    """Loads modules from a directory."""
    target_dir = BASE_DIR / dir_path
    modules = {}
    for filepath in target_dir.glob(f"**{sep}*{file_pattern}.py"):
        if not filepath.is_file():
            continue
        namespaces = []
        for namespace in filepath.parts[::-1][1:]:
            if namespace == __name__.split(".")[0]:
                break
            namespaces.insert(0, namespace)
        namespaces.insert(0, __name__.split(".")[0])
        namespaces.append(filepath.stem)
        namespace = ".".join(namespaces)

        module = import_module(namespace)
        exports = get_exports(namespace, module)
        modules[namespace] = exports
    if log:
        Logger.main.info(f"Loaded [b green]{file_pattern}[/] modules in [b green]{dir_path}[/]")
    return modules


if IS_BUNDLE:

    def load_modules(
        dir_path: str, file_pattern: str, base_type: _TBase = Type, log: bool = True
    ) -> dict[str, list[_TBase]]:
        """디렉토리에서 모듈을 로드합니다 (PyInstaller 환경을 고려한 방식)."""
        modules = {}

        package_path = __name__.split(".")[0]
        import_module(package_path)

        # 디렉토리 내의 모든 모듈을 탐색합니다.
        for _, module_name, ispkg in walk_packages(
            path=[str(BASE_DIR / dir_path)],
            prefix=package_path + ".",
            onerror=lambda x: None,
        ):
            namespaces = [package_path]
            for dir_name in dir_path.split(sep):
                namespaces.append(dir_name)
            namespaces.append(module_name.replace(f"{package_path}.", ""))
            namespace = ".".join(namespaces)
            if not ispkg and module_name.endswith(file_pattern):
                module = import_module(namespace)
                exports = get_exports(namespace, module)
                modules[namespace] = exports

        if log:
            Logger.main.info(f"Loaded [b green]{file_pattern}[/] modules in [b green]{dir_path}[/]")

        return modules
