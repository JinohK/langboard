from logging import CRITICAL, ERROR, INFO, NOTSET, Handler, basicConfig, getLevelNamesMapping, getLogger, setLoggerClass
from logging import Logger as LoggingLogger
from pathlib import Path
from typing import Any
from rich.logging import RichHandler
from sentry_sdk import init as sentry_init
from ..Env import Env
from .LogFileHandler import LogFileHandler


class _LoggerWrapper(LoggingLogger):
    def __init__(self, name, level=NOTSET):
        if not name.startswith(Env.PROJECT_NAME):
            level = ERROR
        super().__init__(name, level)


setLoggerClass(_LoggerWrapper)


class Logger:
    """Manages the application's logging."""

    main: LoggingLogger

    @property
    def terminal_level(self) -> int:
        levels = getLevelNamesMapping()
        return (
            levels[Env.TERMINAL_LOGGING_LEVEL]
            if Env.TERMINAL_LOGGING_LEVEL in levels
            else (levels["INFO"] if Env.ENVIRONMENT == "production" else levels["INFO"])
        )

    @property
    def file_level(self) -> int:
        levels = getLevelNamesMapping()
        return (
            levels[Env.FILE_LOGGING_LEVEL]
            if Env.FILE_LOGGING_LEVEL in levels
            else (levels["ERROR"] if Env.ENVIRONMENT == "production" else levels["WARNING"])
        )

    def __init__(self, log_dir: str | Path):
        self._log_dir = Path(log_dir)
        basicConfig(
            level=self.terminal_level,
            format="%(name)s: %(message)s",
            datefmt="[%Y-%m-%d %X]",
            handlers=self.get_handlers(),
        )

        self.main = getLogger(Env.PROJECT_NAME)

        getLogger("asyncio").setLevel(ERROR)
        getLogger("multipart").setLevel(ERROR)
        getLogger("python_multipart.multipart").setLevel(ERROR)
        getLogger("aiosqlite").setLevel(ERROR)
        getLogger("asyncpg").setLevel(ERROR)
        getLogger("httpx").setLevel(ERROR)
        getLogger("urllib3.connectionpool").setLevel(ERROR)
        getLogger("httpcore.connection").setLevel(ERROR)
        getLogger("httpcore.http11").setLevel(ERROR)
        getLogger("strawberry.execution").setLevel(CRITICAL)

        if Env.SENTRY_DSN:
            sentry_init(
                dsn=Env.SENTRY_DSN,
                environment=Env.ENVIRONMENT if Env.ENVIRONMENT == "production" else "development",
            )

    def get_config(self) -> dict[str, Any]:
        return {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "()": "uvicorn.logging.DefaultFormatter",
                    "fmt": f"{Env.PROJECT_NAME}: %(message)s",
                    "datefmt": "[%Y-%m-%d %X]",
                    "use_colors": False,
                },
                "access": {
                    "()": "uvicorn.logging.AccessFormatter",
                    "fmt": f'{Env.PROJECT_NAME}: %(client_addr)s - "%(request_line)s" %(status_code)s',  # noqa: E501
                    "datefmt": "[%Y-%m-%d %X]",
                    "use_colors": False,
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "rich.logging.RichHandler",
                    "level": self.terminal_level,
                    "omit_repeated_times": False,
                    "markup": True,
                    "rich_tracebacks": True,
                    "tracebacks_show_locals": True,
                },
                "access": {
                    "formatter": "access",
                    "class": "rich.logging.RichHandler",
                    "level": self.terminal_level,
                    "omit_repeated_times": False,
                    "markup": True,
                    "rich_tracebacks": True,
                    "tracebacks_show_locals": True,
                },
                "file": {
                    "class": "core.logger.LogFileHandler.LogFileHandler",
                    "level": self.file_level,
                    "log_dir": str(self._log_dir),
                },
                "executable_file": {
                    "class": "core.logger.LogFileHandler.LogFileHandler",
                    "level": self.file_level,
                    "log_dir": str(self._log_dir / "executable"),
                    "is_terminal": True,
                },
            },
            "loggers": {
                "uvicorn": {"handlers": ["default", "file"], "level": self.terminal_level, "propagate": False},
                "uvicorn.error": {"handlers": ["default", "file"], "level": self.terminal_level, "propagate": False},
                "uvicorn.access": {"handlers": ["access", "file"], "level": self.terminal_level, "propagate": False},
            },
        }

    @staticmethod
    def use(name: str) -> LoggingLogger:
        """Returns a logger with the given name."""
        return getLogger(f"{Env.PROJECT_NAME}.{name}")

    def get_handlers(self) -> list[Handler]:
        handlers = [
            RichHandler(
                level=self.terminal_level,
                omit_repeated_times=False,
                markup=True,
                rich_tracebacks=True,
                tracebacks_show_locals=True,
            ),
            LogFileHandler(level=self.file_level, log_dir=self._log_dir),
        ]

        if Env.IS_EXECUTABLE:
            handlers.append(
                LogFileHandler(level=INFO, log_dir=self._log_dir / "executable", is_terminal=True),
            )

        return handlers
