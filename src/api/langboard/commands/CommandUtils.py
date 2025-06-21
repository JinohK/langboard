from pathlib import Path
from typing import Literal
from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from core.utils.StringCase import StringCase
from pydantic import BaseModel
from ..Constants import BASE_DIR, ROOT_DIR
from ..core.logger import Logger


logger = Logger.use("cli")

_TPyConfigType = Literal["model", "task", "publisher", "command", "seed"]


def _get_py_config(config_type: _TPyConfigType):
    class _TPyConfig(BaseModel):
        dirpath: Path
        filename: str
        should_update_init: bool

    config_map: dict[_TPyConfigType, _TPyConfig] = {
        "model": _TPyConfig(
            dirpath=BASE_DIR / ".." / ".." / "shared" / "models",
            filename="{name}.py",
            should_update_init=True,
        ),
        "task": _TPyConfig(
            dirpath=BASE_DIR / "tasks",
            filename="{name}Task.py",
            should_update_init=False,
        ),
        "publisher": _TPyConfig(
            dirpath=BASE_DIR / "publishers",
            filename="{name}Publisher.py",
            should_update_init=True,
        ),
        "command": _TPyConfig(
            dirpath=BASE_DIR / "commands",
            filename="{name}Command.py",
            should_update_init=False,
        ),
        "seed": _TPyConfig(
            dirpath=BASE_DIR / "migrations" / "seeds",
            filename="{name}Seed.py",
            should_update_init=True,
        ),
    }

    return config_map.get(config_type, None)


def make_name(name: str, remove_ends: str | None = None) -> str:
    name = StringCase(name).to_pascal()
    if remove_ends and (name.endswith(remove_ends) or name.endswith(remove_ends.lower())):
        name = name[: -len(remove_ends)]

    return name


def format_template(file_name: str, formats: dict[str, str]) -> str:
    template_path = get_template_path(f"{file_name}.py")
    formats["empty_dict"] = "{}"
    formats["sb"] = "{"
    formats["eb"] = "}"
    return template_path.read_text().format_map(formats)


def create_py(config_type: _TPyConfigType, name: str, code: str) -> None:
    config = _get_py_config(config_type)
    if not config:
        raise ValueError(f"Py config type: {config_type}")

    file_name = config.filename.format(name=name)
    save_path = config.dirpath / file_name

    config.dirpath.mkdir(parents=True, exist_ok=True)

    if save_path.exists():
        raise FileExistsError(f"{config_type.capitalize()} already exists: {name}")

    with open(save_path, "w") as f:
        f.write(code)
        f.close()

    logger.info(f"Created {config_type}: {name}")

    if config.should_update_init:
        update_init_py(config.dirpath)


def create_service_py(name: str, code: str, factory: tuple[str, str] | None = None) -> None:
    target_dir = BASE_DIR / "services" / "factory"
    if factory:
        target_dir = target_dir / factory[0]

    class_name = f"{name}{factory[1]}Service" if factory else f"{name}Service"
    save_path = target_dir / f"{class_name}.py"
    main_service = (
        (BASE_DIR / "services" / "factory" / f"{factory[1]}Service.py")
        if factory
        else (BASE_DIR / "services" / "Service.py")
    )

    target_dir.mkdir(parents=True, exist_ok=True)

    if save_path.exists():
        raise FileExistsError(f"Service already exists: {name}")

    with open(save_path, "w") as f:
        f.write(code)
        f.close()

    logger.info(f"Created service: {save_path}")

    update_init_py(target_dir)

    main_service_code = main_service.read_text()
    codes = [main_service_code]
    codes.append("    @property")
    codes.append(f"    def {StringCase(name).to_snake()}(self):")
    codes.append(f"        return self._create_or_get_service(factory.{class_name})\n")

    with open(main_service, "w") as f:
        f.write("\n".join(codes))
        f.close()

    logger.info(f"Updated service imports: {main_service}")


def get_template_path(file_name: str) -> Path:
    return Path(__file__).parent / "templates" / f"{file_name}.template"


def update_init_py(target_dir: Path) -> None:
    init_path = target_dir / "__init__.py"
    existed_names: list[str] = []
    for file in target_dir.glob("*.py"):
        if file.name.count("__") > 1 or file.name.startswith("Base") or file.name.replace(".py", "").endswith("Types"):
            continue

        existed_names.append(file.stem)

    with open(init_path, "w") as f:
        for existed_name in existed_names:
            f.write(f"from .{existed_name} import {existed_name}\n")
        f.write("\n\n__all__ = [\n")
        for existed_name in existed_names:
            f.write(f'    "{existed_name}",\n')
        f.write("]\n")
        f.close()

    logger.info(f"Updated init file: {init_path}")


def run_db_command(command: Literal["upgrade", "downgrade", "migrate"], *args, **kwargs) -> None:
    alembic_config = AlembicConfig(str(ROOT_DIR / "alembic.ini"))

    if command == "upgrade":
        alembic_command.upgrade(alembic_config, *args, **kwargs)
    elif command == "downgrade":
        alembic_command.downgrade(alembic_config, *args, **kwargs)
    elif command == "migrate":
        alembic_command.revision(alembic_config, *args, **kwargs)
    else:
        raise ValueError("Unknown db command.")
