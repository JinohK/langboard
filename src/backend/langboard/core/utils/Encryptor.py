from cryptocode import encrypt, decrypt
from base64 import b64encode, b64decode
from .decorators import thread_safe_singleton


@thread_safe_singleton
class Encryptor:
    """Encrypts and decrypts data using a key."""

    def encrypt(self, data: str, key: str) -> str:
        encrypted = encrypt(data, key).encode()
        base64_encoded = b64encode(encrypted).decode()
        return base64_encoded

    def decrypt(self, data: str, key: str) -> str:
        base64_decoded = b64decode(data.encode()).decode()
        decrypted = decrypt(base64_decoded, key)
        return decrypted


Encryptor = Encryptor()
