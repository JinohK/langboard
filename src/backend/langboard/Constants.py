from enum import Enum
from importlib import metadata
from os import environ
from os.path import dirname
from pathlib import Path
from typing import Any, Literal, cast


_TDatabaseRole = Literal["SELECT", "INSERT", "UPDATE", "DELETE"]


def _get_env(name: str, default: Any = None) -> Any | str:
    is_default = name not in environ or not environ[name]
    return default if is_default else environ[name]


# Project
PROJECT_NAME = _get_env("PROJECT_NAME")

# Directory
BASE_DIR = Path(dirname(__file__))
DATA_DIR = BASE_DIR / ".." / ".." / ".." / "local"

# URL
HOST = _get_env("BACKEND_HOST", "localhost")
PORT = int(_get_env("BACKEND_PORT", "5381"))
FRONTEND_PORT = int(_get_env("FRONTEND_PORT", "5173"))
PUBLIC_FRONTEND_URL = _get_env("PUBLIC_FRONTEND_URL", f"http://{HOST}:{FRONTEND_PORT}")
FRONTEND_REDIRECT_URL = f"{PUBLIC_FRONTEND_URL}/redirect"

# Environment
ENVIRONMENT = _get_env("ENVIRONMENT", "local")
PROJECT_NAME = _get_env("PROJECT_NAME")
PROJECT_VERSION = metadata.version(PROJECT_NAME)

# Logging
TERMINAL_LOGGING_LEVEL = _get_env("TERMINAL_LOGGING_LEVEL", "AUTO").upper()
FILE_LOGGING_LEVEL = _get_env("FILE_LOGGING_LEVEL", "AUTO").upper()
LOGGING_DIR = Path(_get_env("LOGGING_DIR", DATA_DIR / "logs" / "backend"))

# Database
MAIN_DATABASE_URL = _get_env("MAIN_DATABASE_URL", f"sqlite+aiosqlite:///{PROJECT_NAME}.db")
MAIN_DATABASE_ROLE: set[_TDatabaseRole] = cast(
    Any, set(_get_env("MAIN_DATABASE_ROLE", "INSERT,UPDATE,DELETE").replace(" ", "").upper().split(","))
)
SUB_DATABASE_URL = _get_env("SUB_DATABASE_URL", MAIN_DATABASE_URL)
SUB_DATABASE_ROLE: set[_TDatabaseRole] = cast(
    Any, set(_get_env("SUB_DATABASE_ROLE", "SELECT").replace(" ", "").upper().split(","))
)
_AVAILABLE_DATABASE_ROLES = set(["SELECT", "INSERT", "UPDATE", "DELETE"])

for role in MAIN_DATABASE_ROLE:
    if role in SUB_DATABASE_ROLE:
        raise ValueError(f"Database role conflict: {role}")

_added_roles = set()
for role in set([*MAIN_DATABASE_ROLE, *SUB_DATABASE_ROLE]):
    if role not in _AVAILABLE_DATABASE_ROLES:
        raise ValueError(f"Invalid database role: {role}")
    _added_roles.add(role)

if _added_roles != _AVAILABLE_DATABASE_ROLES:
    raise ValueError(f"Database roles must include all of {_AVAILABLE_DATABASE_ROLES}")

# Cache
CACHE_TYPE: Literal["in-memory", "redis"] = cast(Any, _get_env("CACHE_TYPE", "in-memory"))
CACHE_URL = _get_env("CACHE_URL")
_AVAILABLE_CACHE_TYPES = set(["in-memory", "redis"])

if CACHE_TYPE not in _AVAILABLE_CACHE_TYPES:
    raise ValueError(f"Invalid cache type: {CACHE_TYPE}. Must be one of {_AVAILABLE_CACHE_TYPES}")

# Security
COMMON_SECRET_KEY = _get_env("COMMON_SECRET_KEY", f"{PROJECT_NAME}_common_key")
JWT_SECRET_KEY = _get_env("JWT_SECRET_KEY", f"{PROJECT_NAME}_secret_key")
JWT_ALGORITHM = _get_env("JWT_ALGORITHM", "HS256")
JWT_AT_EXPIRATION = int(_get_env("JWT_AT_EXPIRATION", 60 * 60 * 3))  # 3 hours for default
JWT_RT_EXPIRATION = int(_get_env("JWT_RT_EXPIRATION", 30))  # 30 days for default

# Storage
LOCAL_STORAGE_DIR = Path(_get_env("LOCAL_STORAGE_DIR", DATA_DIR / "uploads"))
S3_ACCESS_KEY_ID = _get_env("S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = _get_env("S3_SECRET_ACCESS_KEY")
S3_REGION_NAME = _get_env("S3_REGION_NAME", "us-east-1")
S3_BUCKET_NAME = _get_env("S3_BUCKET_NAME", PROJECT_NAME)


# Frontend query names
class QUERY_NAMES(Enum):
    SUB_EMAIL_VERIFY_TOKEN = "bEvt"
    RECOVERY_TOKEN = "rtK"
    SIGN_UP_ACTIVATE_TOKEN = "sAVk"
    PROJCT_INVITATION_TOKEN = "PikQ"
    BOARD = "bp"
    BOARD_CARD = "BpC"
    BOARD_CARD_CHUNK = "BpCC"
    BOARD_WIKI = "bPw"
    BOARD_WIKI_CHUNK = "BpWc"
