from typing import Any
from sqlalchemy import NullPool, StaticPool
from ...Constants import DB_TCP_USER_TIMEOUT, DB_TIMEOUT, PROJECT_NAME
from ..utils.decorators import staticclass


@staticclass
class DbConfigHelper:
    @staticmethod
    def create_config(url: str) -> dict[str, Any]:
        if url.startswith("sqlite"):
            return {
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": DB_TIMEOUT,
                },
                "poolclass": StaticPool,
                "pool_pre_ping": True,
            }

        if url.startswith("postgresql"):
            return {
                "connect_args": {
                    "conninfo": f"application_name={PROJECT_NAME}&timeout={DB_TIMEOUT}&statement_cache_size=0&tcp_user_timeout={DB_TCP_USER_TIMEOUT}",
                },
                "poolclass": NullPool,
                "pool_pre_ping": True,
            }

        return {}

    @staticmethod
    def get_sanitized_driver(url: str) -> str:
        splitted = url.split("://", maxsplit=1)
        driver = splitted[0]
        if driver == "sqlite":
            return f"sqlite://{splitted[1]}"
        if driver == "postgresql":
            return f"postgresql+psycopg://{splitted[1]}"
        return url
