from os.path import dirname
from pathlib import Path
from sys import executable
from core.caching import Cache
from core.Env import Env


# Directory
BASE_DIR = Path(dirname(__file__)) if not Env.IS_EXECUTABLE else Path(dirname(executable))
ROOT_DIR = BASE_DIR / ".." / ".." / ".."
DATA_DIR = ROOT_DIR / "local" if not Env.IS_EXECUTABLE else BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# URL
HOST = Env.get_from_env("FLOWS_HOST", "localhost")
PORT = int(Env.get_from_env("FLOWS_PORT", "5019"))

# Logging
LOGGING_DIR = Path(Env.get_from_env("FLOWS_LOGGING_DIR", DATA_DIR / "logs" / "flows"))

# App Config
APP_CONFIG_FILE = DATA_DIR / "flows_config.json"

# Cache
CACHE_DIR = DATA_DIR / "cache"
Cache.set_cache_dir(CACHE_DIR)


if Env.MAIN_DATABASE_URL.startswith("sqlite"):
    sqlite_path = Env.MAIN_DATABASE_URL.split(":///")[-1]
    Env.update_env("MAIN_DATABASE_URL", f"sqlite:///{ROOT_DIR / sqlite_path}")
if Env.READONLY_DATABASE_URL.startswith("sqlite"):
    sqlite_path = Env.MAIN_DATABASE_URL.split(":///")[-1]
    Env.update_env("READONLY_DATABASE_URL", f"sqlite:///{ROOT_DIR / sqlite_path}")
