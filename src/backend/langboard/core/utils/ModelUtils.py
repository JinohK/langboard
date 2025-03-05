from typing import cast
from ... import models
from ..ai import Bot, BotTrigger
from ..db import BaseSqlModel, User
from ..setting import AppSetting


def get_model_by_table_name(table_name: str) -> type[BaseSqlModel] | None:
    tables = getattr(get_model_by_table_name, "__tables", {})
    setattr(get_model_by_table_name, "__tables", tables)

    if table_name in tables:
        return tables[table_name]

    if table_name == User.__tablename__:
        tables[table_name] = User
        return User
    elif table_name == Bot.__tablename__:
        tables[table_name] = Bot
        return Bot
    elif table_name == BotTrigger.__tablename__:
        tables[table_name] = BotTrigger
        return BotTrigger
    elif table_name == AppSetting.__tablename__:
        tables[table_name] = AppSetting
        return AppSetting
    for model_name in models.__all__:
        model = cast(type[BaseSqlModel], models.__dict__[model_name])
        if model.__tablename__ == table_name:
            tables[table_name] = model
            return model
    return None
