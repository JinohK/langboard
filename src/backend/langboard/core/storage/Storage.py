from typing import BinaryIO
from ..utils.decorators import class_instance, singleton
from .BaseStorage import BaseStorage
from .FileModel import FileModel
from .LocalStorage import LocalStorage
from .S3Storage import S3Storage
from .StorageName import StorageName


@class_instance()
@singleton
class Storage:
    def __init__(self):
        self._storages: dict[str, BaseStorage] = {
            S3Storage.storage_type: S3Storage(),
            LocalStorage.storage_type: LocalStorage(),
        }

    def get(self, storage_type: str, storage_name: str, filename: str) -> bytes | None:
        storage_type = BaseStorage.decrypt_storage_type(storage_type)
        if not storage_type or storage_type not in self._storages:
            return None

        storage = self._storages[storage_type]
        return storage.get(storage_name, filename)

    def upload(self, file: BinaryIO, storage_name: StorageName) -> FileModel | None:
        if not file.name:
            return None

        for storage_type, storage in self._storages.items():
            if storage_type == LocalStorage.storage_type:
                continue

            if storage.is_connectable():
                return storage.upload(file, storage_name)

        return self._storages[LocalStorage.storage_type].upload(file, storage_name)

    def delete(self, file_model: FileModel) -> bool:
        if file_model.storage_type not in self._storages:
            return False

        storage = self._storages[file_model.storage_type]
        return storage.delete(file_model)
