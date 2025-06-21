from enum import Enum
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
HOST = Env.get_from_env("BACKEND_HOST", "localhost")
PORT = int(Env.get_from_env("BACKEND_PORT", "5381"))
FRONTEND_PORT = int(Env.get_from_env("FRONTEND_PORT", "5173"))
PUBLIC_FRONTEND_URL = (
    Env.get_from_env("PUBLIC_FRONTEND_URL", f"http://{HOST}:{FRONTEND_PORT}")
    if Env.ENVIRONMENT != "local"
    else f"http://{HOST}:{FRONTEND_PORT}"
)
FRONTEND_REDIRECT_URL = f"{PUBLIC_FRONTEND_URL}/redirect"

# Logging
LOGGING_DIR = Path(Env.get_from_env("LOGGING_DIR", DATA_DIR / "logs" / "backend"))

# Storage
LOCAL_STORAGE_DIR = Path(Env.get_from_env("LOCAL_STORAGE_DIR", DATA_DIR / "uploads"))

# Scheduler
CRON_TAB_FILE = Path(Env.get_from_env("CRON_TAB_FILE", DATA_DIR / "cron.tab"))

# App Config
APP_CONFIG_FILE = DATA_DIR / "api_config.json"


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
