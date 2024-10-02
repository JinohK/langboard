from importlib import metadata
from os import environ
from os.path import dirname
from pathlib import Path


# Environment
ENVIRONMENT = environ.get("ENVIRONMENT", "local")
PROJECT_NAME = environ.get("PROJECT_NAME")
PROJECT_VERSION = metadata.version(PROJECT_NAME)

# Logging
TERMINAL_LOGGING_LEVEL = environ.get("TERMINAL_LOGGING_LEVEL", "AUTO").upper()
FILE_LOGGING_LEVEL = environ.get("FILE_LOGGING_LEVEL", "AUTO").upper()
LOGGING_DIR = Path(environ.get("LOGGING_DIR", Path(dirname(__file__)) / ".." / ".." / ".." / "logs"))

# Database
MAIN_DATABASE_URL = environ.get("MAIN_DATABASE_URL", f"sqlite:///{PROJECT_NAME}.db")
MAIN_DATABASE_ROLE = set(environ.get("MAIN_DATABASE_ROLE", "INSERT,UPDATE,DELETE").replace(" ", "").upper().split(","))
SUB_DATABASE_URL = environ.get("SUB_DATABASE_URL", MAIN_DATABASE_URL)
SUB_DATABASE_ROLE = set(environ.get("SUB_DATABASE_ROLE", "SELECT").replace(" ", "").upper().split(","))
AVAILABLE_DATABASE_ROLES = set(["SELECT", "INSERT", "UPDATE", "DELETE"])

for role in MAIN_DATABASE_ROLE:
    if role in SUB_DATABASE_ROLE:
        raise ValueError(f"Database role conflict: {role}")

_added_roles = set()
for role in set([*MAIN_DATABASE_ROLE, *SUB_DATABASE_ROLE]):
    if role not in AVAILABLE_DATABASE_ROLES:
        raise ValueError(f"Invalid database role: {role}")
    _added_roles.add(role)

if _added_roles != AVAILABLE_DATABASE_ROLES:
    raise ValueError(f"Database roles must include all of {AVAILABLE_DATABASE_ROLES}")

# Directory
BASE_DIR = Path(dirname(__file__))
