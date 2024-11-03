from pathlib import Path
from ....Constants import BASE_DIR
from ...logger import Logger
from ...utils.String import concat, pascal_to_snake, snake_to_pascal


_logger = Logger.use("cli")


def make_name(name: str, remove_ends: str | None = None) -> str:
    if "_" in name:
        name = snake_to_pascal(name)
    elif name[0].islower():
        name = concat(name[0].upper(), *name[1:])

    if remove_ends and (name.endswith(remove_ends) or name.endswith(remove_ends.lower())):
        name = name[: -len(remove_ends)]

    return name


def get_template_path(file_name: str) -> Path:
    return Path(__file__).parent / "templates" / f"{file_name}.template"


def format_template(file_name: str, formats: dict[str, str]) -> str:
    template_path = get_template_path(f"{file_name}.py")
    return template_path.read_text().format_map(formats)


def update_init_py(target_dir: Path, init_path: Path) -> None:
    existed_names: list[str] = []
    for file in target_dir.glob("*.py"):
        if file.name.count("__") > 1 or file.name.startswith("Base"):
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

    _logger.info(f"Updated init file: {init_path}")


def create_model_py(name: str, code: str) -> None:
    target_dir = BASE_DIR / "models"
    save_path = target_dir / f"{name}.py"
    init_path = target_dir / "__init__.py"

    target_dir.mkdir(parents=True, exist_ok=True)

    if save_path.exists():
        raise FileExistsError(f"Model already exists: {name}")

    with open(save_path, "w") as f:
        f.write(code)
        f.close()

    _logger.info(f"Created model: {name}")

    update_init_py(target_dir, init_path)


def create_service_py(name: str, code: str, is_role: bool) -> None:
    target_dir = BASE_DIR / "services" / "factory"
    if is_role:
        target_dir = target_dir / "roles"

    class_name = f"{name}RoleService" if is_role else f"{name}Service"
    save_path = target_dir / f"{class_name}.py"
    init_path = target_dir / "__init__.py"
    main_service = (
        (BASE_DIR / "services" / "factory" / "RoleService.py") if is_role else (BASE_DIR / "services" / "Service.py")
    )

    target_dir.mkdir(parents=True, exist_ok=True)

    if save_path.exists():
        raise FileExistsError(f"Service already exists: {name}")

    with open(save_path, "w") as f:
        f.write(code)
        f.close()

    _logger.info(f"Created service: {save_path}")

    update_init_py(target_dir, init_path)

    main_service_code = main_service.read_text()
    codes = [main_service_code]
    codes.append("    @property")
    codes.append(f"    def {pascal_to_snake(name)}(self):")
    codes.append(f"        return self._create_or_get_service(factory.{class_name})\n")

    with open(main_service, "w") as f:
        f.write("\n".join(codes))
        f.close()

    _logger.info(f"Updated service imports: {main_service}")


def create_bot_py(name: str, code: str) -> None:
    target_dir = BASE_DIR / "bots"
    save_path = target_dir / f"{name}Bot.py"

    target_dir.mkdir(parents=True, exist_ok=True)

    if save_path.exists():
        raise FileExistsError(f"Bot already exists: {name}")

    with open(save_path, "w") as f:
        f.write(code)
        f.close()

    _logger.info(f"Created bot: {name}")
