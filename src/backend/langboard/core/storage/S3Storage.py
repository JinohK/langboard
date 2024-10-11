from tempfile import TemporaryFile
from typing import BinaryIO
from boto3 import client
from ...Constants import S3_ACCESS_KEY_ID, S3_BUCKET_NAME, S3_REGION_NAME, S3_SECRET_ACCESS_KEY
from ..utils.String import get_random_filename
from .BaseStorage import BaseStorage
from .FileModel import FileModel
from .StorageName import StorageName


class S3Storage(BaseStorage):
    storage_type = "s3"

    def get(self, storage_name: str, filename: str) -> bytes | None:
        try:
            s3_client = self._connect_client()
            temp_file = TemporaryFile("w+b")
            s3_client.download_fileobj(Bucket=S3_BUCKET_NAME, Key=f"{storage_name}/{filename}", Fileobj=temp_file)
            s3_client.close()
            temp_file.seek(0)
            return temp_file.read()
        except Exception:
            return None

    def upload(self, file: BinaryIO, storage_name: StorageName) -> FileModel | None:
        if not file.name:
            return None

        try:
            new_filename = get_random_filename(file.name)
            s3_client = self._connect_client()
            s3_client.upload_fileobj(Fileobj=file, Bucket=S3_BUCKET_NAME, Key=f"{storage_name}/{new_filename}")
            s3_client.close()

            return FileModel(
                storage_type=S3Storage.storage_type,
                storage_name=storage_name.value,
                original_filename=file.name,
                filename=new_filename,
                path=f"/file/{self._encrypt_storage_type(S3Storage.storage_type)}/{storage_name.value}/{new_filename}",
            )
        except Exception:
            return None

    def delete(self, file_model: FileModel) -> bool:
        if file_model.storage_type != S3Storage.storage_type:
            return False

        try:
            s3_client = self._connect_client()
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=f"{file_model.storage_name}/{file_model.filename}")
            s3_client.close()
            return True
        except Exception:
            return False

    def is_connectable(self) -> bool:
        if not S3_ACCESS_KEY_ID or not S3_SECRET_ACCESS_KEY:
            return False

        try:
            self._connect_client()
            return True
        except Exception:
            return False

    def _connect_client(self):
        return client(
            "s3",  # type: ignore
            region_name=S3_REGION_NAME,
            aws_access_key_id=S3_ACCESS_KEY_ID,
            aws_secret_access_key=S3_SECRET_ACCESS_KEY,
        )
