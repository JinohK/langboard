from logging import ERROR, INFO, NOTSET, Handler, basicConfig, getLevelNamesMapping, getLogger, setLoggerClass
from logging import Logger as LoggingLogger
from rich.logging import RichHandler
from sentry_sdk import init as sentry_init
from ...Constants import (
    ENVIRONMENT,
    FILE_LOGGING_LEVEL,
    IS_EXECUTABLE,
    LOGGING_DIR,
    PROJECT_NAME,
    SENTRY_DSN,
    TERMINAL_LOGGING_LEVEL,
)
from ..utils.decorators import class_instance, thread_safe_singleton
from .LogFileHandler import LogFileHandler


class _LoggerWrapper(LoggingLogger):
    def __init__(self, name, level=NOTSET):
        if not name.startswith(PROJECT_NAME):
            level = ERROR
        super().__init__(name, level)


setLoggerClass(_LoggerWrapper)


@class_instance()
@thread_safe_singleton
class Logger:
    """Manages the application's logging."""

    main: LoggingLogger

    def __init__(self):
        basicConfig(
            level=self.terminal_level,
            format="%(name)s: %(message)s",
            datefmt="[%Y-%m-%d %X]",
            handlers=self.get_handlers(),
        )

        self.main = getLogger(PROJECT_NAME)

        getLogger("asyncio").setLevel(ERROR)
        getLogger("multipart").setLevel(ERROR)
        getLogger("python_multipart.multipart").setLevel(ERROR)
        getLogger("aiosqlite").setLevel(ERROR)
        getLogger("asyncpg").setLevel(ERROR)
        getLogger("httpx").setLevel(ERROR)
        getLogger("urllib3.connectionpool").setLevel(ERROR)
        getLogger("httpcore.connection").setLevel(ERROR)
        getLogger("httpcore.http11").setLevel(ERROR)
        getLogger("watchdog.observers.inotify_buffer").setLevel(ERROR)

        if SENTRY_DSN:
            sentry_init(
                dsn=SENTRY_DSN,
                environment=ENVIRONMENT if ENVIRONMENT == "production" else "development",
            )

    @property
    def terminal_level(self) -> int:
        levels = getLevelNamesMapping()
        return (
            levels[TERMINAL_LOGGING_LEVEL]
            if TERMINAL_LOGGING_LEVEL in levels
            else (levels["INFO"] if ENVIRONMENT == "production" else levels["DEBUG"])
        )

    @property
    def file_level(self) -> int:
        levels = getLevelNamesMapping()
        return (
            levels[FILE_LOGGING_LEVEL]
            if FILE_LOGGING_LEVEL in levels
            else (levels["ERROR"] if ENVIRONMENT == "production" else levels["WARNING"])
        )

    def use(self, name: str) -> LoggingLogger:
        """Returns a logger with the given name."""
        if name == "main":
            return self.main
        return getLogger(f"{PROJECT_NAME}.{name}")

    def get_handlers(self) -> list[Handler]:
        handlers = [
            RichHandler(
                level=self.terminal_level,
                omit_repeated_times=False,
                markup=True,
                rich_tracebacks=True,
                tracebacks_show_locals=True,
            ),
            LogFileHandler(level=self.file_level, log_dir=LOGGING_DIR),
        ]

        if IS_EXECUTABLE:
            handlers.append(
                LogFileHandler(level=INFO, log_dir=LOGGING_DIR / "executable", is_terminal=True),
            )

        return handlers
