from core import FastAPIRunner
from core.Env import Env
from .Constants import APP_CONFIG_FILE, BASE_DIR
from .core.logger import Logger


def run():
    FastAPIRunner.run(f"{Env.PROJECT_NAME}_flows.AppInstance:app", APP_CONFIG_FILE, Logger, BASE_DIR)
