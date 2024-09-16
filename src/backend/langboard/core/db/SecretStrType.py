from pydantic import SecretStr
from sqlalchemy.types import TEXT, TypeDecorator


class SecretStrType(TypeDecorator):
    impl = TEXT

    def process_bind_param(self, value: SecretStr, dialect) -> str:
        return value.get_secret_value()

    def process_result_value(self, value: str, dialect) -> SecretStr:
        return SecretStr(value)
