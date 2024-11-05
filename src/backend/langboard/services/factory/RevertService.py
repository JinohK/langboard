from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, Literal, cast, overload
from pydantic import BaseModel
from sqlalchemy import Row, column, delete, insert, table, text, update
from ...core.db import BaseSqlModel, SoftDeleteModel
from ...core.storage import FileModel, Storage
from ...core.utils.DateTime import now
from ...models import RevertableRecord
from ...models.RevertableRecord import RevertType
from ..BaseService import BaseService


class RevertRecordModel(BaseModel):
    unsaved_model: BaseSqlModel
    revert_type: RevertType
    file_columns: list[str] = []
    purge: bool = False


class RevertService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "revert"

    async def revert(self, revert_key: str) -> bool:
        sql_query = self._db.query("select").table(RevertableRecord).where(RevertableRecord.revert_key == revert_key)
        result = await self._db.exec(sql_query)
        records = result.all()
        if not records:
            return False

        for record in records:
            current_record_dict = await self.__get_current_record(record)

            if record.valid_until.timestamp() < now().timestamp():
                if record.file_column_names:
                    self.__delete_files(record.file_column_names, record.column_values, current_record_dict)
                await self._db.delete(record)
                await self._db.commit()
                return False

            if record.revert_type == RevertType.Delete:
                sql_query = delete(table(record.table_name)).where(column("id") == record.target_id)
            elif record.revert_type == RevertType.Insert:
                if record.is_soft_delete and not record.is_purged:
                    sql_query = (
                        update(table(record.table_name, column("deleted_at")))
                        .values({"deleted_at": None})
                        .where(column("id") == record.target_id)
                    )
                else:
                    columns = [column(column_name) for column_name in record.column_values.keys()]
                    sql_query = insert(table(record.table_name, *columns)).values(record.column_values)
            else:
                if "id" in record.column_values:
                    record.column_values.pop("id")
                columns = [column(column_name) for column_name in record.column_values.keys()]
                values = {}
                for column_name, value in record.column_values.items():
                    values[column_name] = (
                        json_dumps(value, default=str) if isinstance(value, dict) or isinstance(value, list) else value
                    )
                sql_query = (
                    update(table(record.table_name, *columns)).values(values).where(column("id") == record.target_id)
                )

            if record.file_column_names:
                self.__delete_files(record.file_column_names, current_record_dict, record.column_values)
            await self._db.exec(sql_query)

            await self._db.delete(record)
        await self._db.commit()

        return True

    async def record(self, *revert_record_models: RevertRecordModel) -> str:
        """Record the current state of a model for future reversion

        :param RevertRecordModel.unsaved_model: The model to record and must not be saved in the database
        :param RevertRecordModel.file_columns: The column names that are :cls:`FileModel` type columns
        :param RevertRecordModel.revert_type: The type of revert action to record.
        :param RevertRecordModel.purge: When :param:`revert_type` is :val:`RevertType.Insert`,\n
            it can be set to :val:`True` to purge the record instead of soft deleting it

        :val:`RevertType.Insert` means the model will be deleted in this method\n
            and will be inserted if :meth:`RevertService.revert` is called

        :val:`RevertType.Delete` means the model will be inserted in this method\n
            and will be deleted if :meth:`RevertService.revert` is called

        :val:`RevertType.Update` means the model will be updated if :meth:`RevertService.revert` is called
        """
        revert_key = RevertableRecord.create_revert_key()
        revertable_records = []
        for model in revert_record_models:
            is_purged = False
            if model.revert_type == RevertType.Delete:
                self._db.insert(model.unsaved_model)
                await self._db.commit()
                target_id = cast(int, model.unsaved_model.id)
                prev_record = {}
            elif model.revert_type == RevertType.Insert:
                target_id = cast(int, model.unsaved_model.id)
                prev_record = model.unsaved_model.model_dump()
                if model.purge:
                    is_purged = True
                await self._db.delete(model.unsaved_model, purge=model.purge)  # type: ignore
                await self._db.commit()
            else:
                target_id = cast(int, model.unsaved_model.id)
                prev_record = model.unsaved_model.changes_dict
                await self._db.update(model.unsaved_model)

            file_column_names = [
                column_name for column_name in model.file_columns if column_name in model.unsaved_model.model_fields
            ]

            record = RevertableRecord(
                revert_key=revert_key,
                table_name=model.unsaved_model.__tablename__,
                target_id=target_id,
                column_values=prev_record,
                file_column_names=file_column_names if file_column_names else None,
                revert_type=model.revert_type,
                is_purged=is_purged,
                is_soft_delete=isinstance(model.unsaved_model, SoftDeleteModel),
            )
            revertable_records.append(record)

        self._db.insert_all(revertable_records)
        await self._db.commit()

        return revert_key

    @overload
    def create_record_model(
        self,
        unsaved_model: SoftDeleteModel,
        revert_type: Literal[RevertType.Insert],
        file_columns: list[str] = [],
        purge: bool = False,
    ) -> RevertRecordModel: ...
    @overload
    def create_record_model(
        self, unsaved_model: BaseSqlModel, revert_type: RevertType, file_columns: list[str] = []
    ) -> RevertRecordModel: ...
    def create_record_model(
        self, unsaved_model: BaseSqlModel, revert_type: RevertType, file_columns: list[str] = [], purge: bool = False
    ) -> RevertRecordModel:
        """Record the current state of a model for future reversion

        :param unsaved_model: The model to record and must not be saved in the database
        :param file_columns: The column names that are :cls:`FileModel` type columns
        :param revert_type: The type of revert action to record.
        :param purge: When :param:`revert_type` is :val:`RevertType.Insert`,\n
            it can be set to :val:`True` to purge the record instead of soft deleting it

        :val:`RevertType.Insert` means the model will be deleted in this method\n
            and will be inserted if :meth:`RevertService.revert` is called

        :val:`RevertType.Delete` means the model will be inserted in this method\n
            and will be deleted if :meth:`RevertService.revert` is called

        :val:`RevertType.Update` means the model will be updated if :meth:`RevertService.revert` is called
        """
        return RevertRecordModel(
            unsaved_model=unsaved_model,
            revert_type=revert_type,
            file_columns=file_columns,
            purge=purge if isinstance(unsaved_model, SoftDeleteModel) and revert_type == RevertType.Insert else False,
        )

    async def delete_old_records(self) -> None:
        sql_query = (
            self._db.query("select")
            .table(RevertableRecord)
            .where((RevertableRecord.valid_until < now()) & (RevertableRecord.file_column_names != None))  # noqa
        )
        result = await self._db.exec(sql_query)
        records = result.all()

        for record in records:
            if not record.file_column_names:
                continue
            current_record_dict = await self.__get_current_record(record)
            self.__delete_files(record.file_column_names, record.column_values, current_record_dict)

        sql_query = (
            self._db.query("delete").table(RevertableRecord).where(RevertableRecord.column("valid_until") < now())
        )
        await self._db.exec(sql_query)
        await self._db.commit()

    async def __get_current_record(self, record: RevertableRecord) -> dict[str, Any]:
        result = await self._db.exec(
            self._db.query("select")
            .columns(table(record.table_name), text("*"))  # type: ignore
            .where(column("id") == record.target_id)
        )
        current_record = cast(Row | None, result.first())
        return dict(current_record._mapping) if current_record else {}

    def __delete_files(
        self, file_columns: list[str], delete_record: str | dict[str, Any], current_record: str | dict[str, Any]
    ) -> None:
        deletable_files = []

        old_record = self.__json_loads_recursive(delete_record)
        new_record = self.__json_loads_recursive(current_record)

        for column_name in file_columns:
            if column_name not in old_record:
                continue

            old_file = self.__json_loads_recursive(old_record[column_name])

            if column_name not in new_record:
                if isinstance(old_file, list):
                    deletable_files.extend([FileModel(**file_dict) for file_dict in old_file])
                else:
                    deletable_files.append(FileModel(**old_file))
                continue

            new_file = self.__json_loads_recursive(new_record[column_name])

            if isinstance(old_file, list):
                deletable_files.extend([FileModel(**file_dict) for file_dict in old_file if file_dict not in new_file])
            else:
                if old_file != new_file:
                    deletable_files.append(FileModel(**old_file))

        for file in deletable_files:
            Storage.delete(file)

    def __json_loads_recursive(self, target: Any):
        if not isinstance(target, str):
            return target

        return self.__json_loads_recursive(json_loads(target))
