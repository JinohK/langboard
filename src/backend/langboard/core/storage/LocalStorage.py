from os import path, unlink
from typing import BinaryIO
from ...Constants import LOCAL_STORAGE_DIR
from ..utils.String import get_random_filename
from .BaseStorage import BaseStorage
from .FileModel import FileModel
from .StorageName import StorageName


class LocalStorage(BaseStorage):
    storage_type = "local"

    def get(self, storage_name: str, filename: str) -> bytes | None:
        file_path = LOCAL_STORAGE_DIR / storage_name / filename
        if not path.exists(file_path):
            return None

        with open(file_path, "rb") as f:
            return f.read()

    def upload(self, file: BinaryIO, filename: str, storage_name: StorageName) -> FileModel | None:
        if not filename:
            return None

        storage_path = LOCAL_STORAGE_DIR / storage_name.value
        storage_path.mkdir(parents=True, exist_ok=True)

        new_filename = get_random_filename(filename)
        with open(storage_path / new_filename, "wb") as f:
            f.write(file.read())

        return FileModel(
            storage_type=LocalStorage.storage_type,
            storage_name=storage_name.value,
            original_filename=filename,
            filename=new_filename,
            path=f"/file/{self._encrypt_storage_type(LocalStorage.storage_type)}/{storage_name.value}/{new_filename}",
        )

    def delete(self, file_model: FileModel) -> bool:
        if file_model.storage_type != LocalStorage.storage_type:
            return False

        try:
            unlink(LOCAL_STORAGE_DIR / file_model.filename)
            return True
        except Exception:
            return False

    def is_connectable(self) -> bool:
        return True
