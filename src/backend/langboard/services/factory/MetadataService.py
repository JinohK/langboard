from typing import Any, Literal, TypeVar, overload
from ...core.db import BaseSqlModel, DbSession, SqlBuilder
from ...core.service import BaseService
from ...models.BaseMetadataModel import BaseMetadataModel


_TMetadata = TypeVar("_TMetadata", bound=BaseMetadataModel)


class MetadataService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "metadata"

    @overload
    async def get_list(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, as_api: Literal[False]
    ) -> list[_TMetadata]: ...
    @overload
    async def get_list(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, as_api: Literal[True], as_dict: Literal[False]
    ) -> list[dict[str, Any]]: ...
    @overload
    async def get_list(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, as_api: Literal[True], as_dict: Literal[True]
    ) -> dict[str, Any]: ...
    async def get_list(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, as_api: bool, as_dict: bool = False
    ) -> list[_TMetadata] | list[dict[str, Any]] | dict[str, Any]:
        foreign_key = f"{foreign_model.__tablename__}_id"
        if foreign_key not in model.model_fields:
            return []

        metadata_list = await self._get_all_by(model, foreign_key, foreign_model.id)
        if not as_api:
            return list(metadata_list)

        if not as_dict:
            return [metadata.api_schema() for metadata in metadata_list]

        metadata = {}
        for data in metadata_list:
            metadata[data.key] = data.value
        return metadata

    async def save(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, key: str, value: str, old_key: str | None = None
    ) -> _TMetadata | None:
        foreign_key = f"{foreign_model.__tablename__}_id"
        if foreign_key not in model.model_fields:
            return None

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(model).where(
                    (model.column(foreign_key) == foreign_model.id) & (model.column("key") == (old_key or key))
                )
            )
        metadata = result.first()

        async with DbSession.use() as db:
            if not metadata:
                params: dict[str, Any] = {
                    "key": key,
                    "value": value,
                }
                params[foreign_key] = foreign_model.id
                metadata = model(**params)
                db.insert(metadata)
            else:
                metadata.key = key
                metadata.value = value
                await db.update(metadata)
            await db.commit()

        return metadata

    async def delete(self, model: type[_TMetadata], foreign_model: BaseSqlModel, keys: str | list[str]) -> bool:
        foreign_key = f"{foreign_model.__tablename__}_id"
        if foreign_key not in model.model_fields:
            return False

        if isinstance(keys, str):
            keys = [keys]

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(model).where(
                    (model.column(foreign_key) == foreign_model.id) & (model.column("key").in_(keys))
                )
            )
            await db.commit()

        return True
