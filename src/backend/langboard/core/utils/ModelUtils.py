from typing import cast
import models
from core.db import BaseSqlModel


def get_model_by_table_name(table_name: str) -> type[BaseSqlModel] | None:
    tables = getattr(get_model_by_table_name, "__tables", {})
    setattr(get_model_by_table_name, "__tables", tables)

    if table_name in tables:
        return tables[table_name]

    for model_name in models.__all__:
        model = cast(type[BaseSqlModel], models.__dict__[model_name])
        if model.__tablename__ == table_name:
            tables[table_name] = model
            return model
    return None


def ensure_models_imported():
    pass
