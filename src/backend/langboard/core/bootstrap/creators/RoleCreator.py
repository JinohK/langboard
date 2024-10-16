from .utils import create_model_py, create_service_py, format_template, make_name


def create_role(name: str) -> None:
    """Creates a new service file in the services directory."""
    name = make_name(name, "Role")

    formats = {
        "class_name": name,
    }

    model_code = format_template("role_sql_model", formats)
    create_model_py(f"{name}Role", model_code)

    service_code = format_template("role_service", formats)
    create_service_py(name, service_code, is_role=True)
