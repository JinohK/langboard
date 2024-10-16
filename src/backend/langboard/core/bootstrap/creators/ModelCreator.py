from .utils import create_model_py, format_template, make_name


def create_model(name: str, use_soft_delete: bool = False) -> None:
    """Creates a new model file in the models directory."""
    name = make_name(name)

    base_model = "BaseSqlModel"
    if use_soft_delete:
        base_model = "SoftDeleteModel"

    formats = {
        "class_name": name,
        "base_class": base_model,
    }

    code = format_template("sql_model", formats)

    create_model_py(name, code)
