from threading import Lock
from time import time
from typing import Any
from ..utils.String import BASE62_ALPHABET


class SnowflakeID(int):
    FIXED_SHORT_CODE_LENGTH = 11
    _lock = Lock()
    _sequence = 0
    _last_timestamp = -1

    def __new__(cls, value: int | None = None, machine_id: int = 1, epoch: int = 1704067200000):
        if value is not None:
            return super().__new__(cls, value)

        with cls._lock:
            current_timestamp = cls._current_millis()

            if current_timestamp == cls._last_timestamp:
                cls._sequence = (cls._sequence + 1) & 0xFFF
                if cls._sequence == 0:
                    current_timestamp = cls._wait_next_millis(current_timestamp)
            else:
                cls._sequence = 0

            cls._last_timestamp = current_timestamp

            snowflake_value = ((current_timestamp - epoch) << 22) | (machine_id << 10) | cls._sequence

        return super().__new__(cls, snowflake_value)

    @staticmethod
    def from_short_code(short_code: str) -> "SnowflakeID":
        if not short_code or len(short_code) != SnowflakeID.FIXED_SHORT_CODE_LENGTH:
            return SnowflakeID(0)
        decoded_int = SnowflakeID.__base62_decode(short_code[::-1])
        original_value = SnowflakeID.__reverse_hex(decoded_int)
        return SnowflakeID(original_value)

    @classmethod
    def _current_millis(cls):
        return int(time() * 1000)

    @classmethod
    def _wait_next_millis(cls, last_ts: int):
        ts = cls._current_millis()
        while ts <= last_ts:
            ts = cls._current_millis()
        return ts

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value: Any, _, **kwargs):
        if value is None:
            return cls()
        if isinstance(value, SnowflakeID):
            return value
        if isinstance(value, int):
            return cls(value)
        raise TypeError("SnowflakeID must be an integer or None")

    def __str__(self):
        return str(int(self))

    def __repr__(self):
        return f"SnowflakeID({int(self)})"

    def to_short_code(self) -> str:
        reversed_value = SnowflakeID.__reverse_hex(self)
        return SnowflakeID.__base62_encode(reversed_value)[::-1]

    @staticmethod
    def __reverse_hex(value: int) -> int:
        hex_str = f"{value:016x}"
        reversed_hex_str = hex_str[::-1]
        return int(reversed_hex_str, 16)

    @staticmethod
    def __base62_encode(num: int) -> str:
        if num == 0:
            return "0".rjust(11, "0")

        encoded = []
        base = len(BASE62_ALPHABET)
        n = num
        while n > 0:
            n, r = divmod(n, base)
            encoded.append(BASE62_ALPHABET[r])

        encoded_str = "".join(reversed(encoded))
        if len(encoded_str) > SnowflakeID.FIXED_SHORT_CODE_LENGTH:
            raise ValueError(f"Encoded string length exceeds fixed length of {SnowflakeID.FIXED_SHORT_CODE_LENGTH}")
        return encoded_str.rjust(SnowflakeID.FIXED_SHORT_CODE_LENGTH, "0")

    @staticmethod
    def __base62_decode(encoded: str) -> int:
        base = len(BASE62_ALPHABET)
        decoded = 0
        for char in encoded:
            decoded = decoded * base + BASE62_ALPHABET.index(char)
        return decoded
