from base64 import b64decode, b64encode
from unittest.mock import Mock, patch
from cryptocode import decrypt, encrypt
from langboard.core.utils.Encryptor import Encryptor
from pytest import mark


class TestEncryptor:
    @patch("langboard.core.utils.Encryptor.b64encode")
    @patch("langboard.core.utils.Encryptor.encrypt")
    @mark.parametrize(
        "data,key,actual_result",
        [
            ("Any data", "Any key", Encryptor.encrypt("Any data", "Any key")),
            ("Another data", "Another key", Encryptor.encrypt("Another data", "Another key")),
            ("Data", "Key", Encryptor.encrypt("Data", "Key")),
        ],
    )
    def test_encrypt(
        self, mock_cryptocode_encrypt: Mock, mock_b64encode: Mock, data: str, key: str, actual_result: str
    ):
        mock_cryptocode_encrypt.return_value = encrypt(data, key)
        mock_b64encode.return_value = b64encode(mock_cryptocode_encrypt.return_value.encode())

        expected_result = Encryptor.encrypt(data, key)

        mock_cryptocode_encrypt.assert_called_once_with(data, key)
        mock_b64encode.assert_called_once_with(mock_cryptocode_encrypt.return_value.encode())

        assert expected_result != actual_result, "Expected result is the same as the encrypted data"
        assert Encryptor.decrypt(expected_result, key) == Encryptor.decrypt(actual_result, key) == data

    @patch("langboard.core.utils.Encryptor.b64decode")
    @patch("langboard.core.utils.Encryptor.decrypt")
    @mark.parametrize(
        "data,key,encrypted_data",
        [
            ("Any data", "Any key", Encryptor.encrypt("Any data", "Any key")),
            ("Another data", "Another key", Encryptor.encrypt("Another data", "Another key")),
            ("Data", "Key", Encryptor.encrypt("Data", "Key")),
        ],
    )
    def test_decrypt(
        self, mock_cryptocode_decrypt: Mock, mock_b64decode: Mock, data: str, key: str, encrypted_data: str
    ):
        # Test if the decrypted data is None
        mock_b64decode.return_value = b64decode(encrypted_data.encode())
        mock_cryptocode_decrypt.return_value = None

        expected_result = Encryptor.decrypt(encrypted_data, key)

        mock_b64decode.assert_called_once_with(encrypted_data.encode())
        mock_cryptocode_decrypt.assert_called_once_with(mock_b64decode.return_value.decode(), key)

        assert expected_result == ""

        mock_b64decode.reset_mock()
        mock_cryptocode_decrypt.reset_mock()

        # Test if the decrypted data is valid
        mock_b64decode.return_value = b64decode(encrypted_data.encode())
        mock_cryptocode_decrypt.return_value = decrypt(mock_b64decode.return_value.decode(), key)

        expected_result = Encryptor.decrypt(encrypted_data, key)

        mock_b64decode.assert_called_once_with(encrypted_data.encode())
        mock_cryptocode_decrypt.assert_called_once_with(mock_b64decode.return_value.decode(), key)

        assert expected_result == data
