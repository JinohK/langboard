from pathlib import Path
from ...constants import BASE_DIR


def create_model(name: str, use_soft_delete: bool):
    """Creates a new model file in the models directory."""
    name = name.capitalize()
    template_path = Path(__file__).parent / "model.template"
    template = template_path.read_text()
    model_script = template.format_map(
        {
            "model_name": name,
            "base_model": "SoftDeleteModel" if use_soft_delete else "BaseSqlModel",
        }
    )

    models_dir = BASE_DIR / "models"
    save_path = models_dir / f"{name}.py"
    init_path = models_dir / "__init__.py"

    if not models_dir.exists():
        models_dir.mkdir()

    if save_path.exists():
        raise FileExistsError(f"Model already exists: {name}")

    with open(save_path, "w") as f:
        f.write(model_script)
        f.close()

    model_names: list[str] = []
    for model in models_dir.glob("*.py"):
        if model.name.count("__") > 1:
            continue

        model_names.append(model.stem)

    with open(init_path, "w") as f:
        for model_name in model_names:
            f.write(f"from .{model_name} import {model_name.capitalize()}\n")
        f.write("\n\n__all__ = [\n")
        for model_name in model_names:
            f.write(f'    "{model_name.capitalize()}",\n')
        f.write("]\n")
        f.close()
