from typing import TypeVar, cast
import models
from core.db import BaseSqlModel


_TBaseModel = TypeVar("_TBaseModel", bound=BaseSqlModel)


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


def get_models_by_base_class(base_class: type[_TBaseModel]) -> list[type[_TBaseModel]]:
    models_list = []
    for model_name in models.__all__:
        model = cast(type[_TBaseModel], models.__dict__[model_name])
        if not isinstance(model, type) or not issubclass(model, BaseSqlModel):
            continue

        if issubclass(model, base_class):
            models_list.append(model)
    return models_list


def ensure_models_imported():
    pass
