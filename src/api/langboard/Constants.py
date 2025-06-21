from os.path import dirname
from pathlib import Path
from sys import executable
from core.Env import Env


# Directory
BASE_DIR = Path(dirname(__file__)) if not Env.IS_EXECUTABLE else Path(dirname(executable))
ROOT_DIR = BASE_DIR / ".." / ".." / ".."
DATA_DIR = ROOT_DIR / "local" if not Env.IS_EXECUTABLE else BASE_DIR / "data"
SCHEMA_DIR = DATA_DIR / "schemas"
SCHEMA_DIR.mkdir(exist_ok=True)

# URL
HOST = Env.get_from_env("API_HOST", "localhost")
PORT = int(Env.get_from_env("API_PORT", "5381"))

# Logging
LOGGING_DIR = Path(Env.get_from_env("LOGGING_DIR", DATA_DIR / "logs" / "api"))

# Storage
LOCAL_STORAGE_DIR = Path(Env.get_from_env("LOCAL_STORAGE_DIR", DATA_DIR / "uploads"))

# Scheduler
CRON_TAB_FILE = Path(Env.get_from_env("CRON_TAB_FILE", DATA_DIR / "cron.tab"))

# App Config
APP_CONFIG_FILE = DATA_DIR / "api_config.json"
