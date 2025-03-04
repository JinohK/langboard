from datetime import datetime
from typing import Any
from pydantic import BaseModel


def convert_python_data(data: Any, recursive: bool = False) -> Any:
    if isinstance(data, datetime):
        return data.isoformat()

    if not recursive:
        if isinstance(data, BaseModel):
            return data.model_dump()
        return data

    if isinstance(data, BaseModel):
        model = data.model_dump()
        for key, value in model.items():
            model[key] = convert_python_data(value, recursive=True)
        return model
    elif isinstance(data, list):
        return [convert_python_data(item, recursive=True) for item in data]
    elif isinstance(data, dict):
        return {key: convert_python_data(value, recursive=True) for key, value in data.items()}
    return data
