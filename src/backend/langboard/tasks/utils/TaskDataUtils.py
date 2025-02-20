from datetime import datetime
from typing import Any
from pydantic import BaseModel
from ...core.db import EditorContentModel
from ...core.utils.decorators import staticclass


@staticclass
class TaskDataUtils:
    @staticmethod
    async def convert_to_python(data: Any) -> Any:
        if isinstance(data, EditorContentModel):
            return data.model_dump()
        elif isinstance(data, BaseModel):
            return data.model_dump()
        elif isinstance(data, datetime):
            return data.isoformat()
        return data
