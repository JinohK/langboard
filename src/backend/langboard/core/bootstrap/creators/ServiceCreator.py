from ...utils.String import pascal_to_snake
from .utils import create_service_py, format_template, make_name


def create_service(name: str) -> None:
    """Creates a new service file in the services directory."""
    name = make_name(name, "Service")

    formats = {
        "class_name": name,
        "snake_name": pascal_to_snake(name),
    }

    code = format_template("service", formats)

    create_service_py(name, code, is_role=False)
