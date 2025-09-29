from asyncio import run as run_async
from core import FastAPIRunner
from core.caching import Cache
from core.Env import Env
from .Constants import APP_CONFIG_FILE, BASE_DIR
from .core.logger import Logger


def run():
    run_async(Cache.delete("bot.status.map"))
    FastAPIRunner.run(f"{Env.PROJECT_NAME}_flows.AppInstance:app", APP_CONFIG_FILE, Logger, BASE_DIR)
