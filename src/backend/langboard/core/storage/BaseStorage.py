from abc import ABC, abstractmethod
from typing import BinaryIO
from ..utils.Encryptor import Encryptor
from .FileModel import FileModel
from .StorageName import StorageName


class BaseStorage(ABC):
    storage_type = ""

    @abstractmethod
    def get(self, storage_name: str, filename: str) -> bytes | None:
        """Get a file from the storage and return the bytes.

        :param file_model: The :class:`FileModel` object to get.
        """

    @abstractmethod
    def upload(self, file: BinaryIO, storage_name: StorageName) -> FileModel | None:
        """Upload a file to the storage and return the FileModel object.

        :param file: The :class:`BinaryIO` object to upload.
        """

    @abstractmethod
    def delete(self, file_model: FileModel) -> bool:
        """Delete a file from the storage.

        :param file_model: The :class:`FileModel` object to delete.
        """

    @abstractmethod
    def is_connectable(self) -> bool:
        """Check if the storage is connectable."""

    @staticmethod
    def decrypt_storage_type(storage_type: str) -> str:
        return Encryptor.decrypt(storage_type, "storage_type")

    def _encrypt_storage_type(self, storage_type: str) -> str:
        return Encryptor.encrypt(storage_type, "storage_type")
