from logging import ERROR, basicConfig, getLevelNamesMapping, getLogger
from logging import Logger as LoggingLogger
from rich.logging import RichHandler
from ...Constants import ENVIRONMENT, FILE_LOGGING_LEVEL, LOGGING_DIR, PROJECT_NAME, TERMINAL_LOGGING_LEVEL
from ..utils.decorators import class_instance, thread_safe_singleton
from .LogFileHandler import LogFileHandler


@class_instance()
@thread_safe_singleton
class Logger:
    """Manages the application's logging."""

    main: LoggingLogger

    def __init__(self):
        levels = getLevelNamesMapping()
        terminal_level = (
            levels[TERMINAL_LOGGING_LEVEL]
            if TERMINAL_LOGGING_LEVEL in levels
            else (levels["ERROR"] if ENVIRONMENT == "production" else levels["DEBUG"])
        )
        file_level = (
            levels[FILE_LOGGING_LEVEL]
            if FILE_LOGGING_LEVEL in levels
            else (levels["ERROR"] if ENVIRONMENT == "production" else levels["WARNING"])
        )

        basicConfig(
            level=terminal_level,
            format="%(asctime)s %(name)s: %(message)s",
            datefmt="[%Y-%m-%d %X]",
            handlers=[
                RichHandler(level=terminal_level, markup=True, rich_tracebacks=True, tracebacks_show_locals=True),
                LogFileHandler(level=file_level, log_dir=LOGGING_DIR),
            ],
        )

        self.main = getLogger(PROJECT_NAME)

        getLogger("asyncio").setLevel(ERROR)
        getLogger("multipart").setLevel(ERROR)
        getLogger("aiosqlite").setLevel(ERROR)
        getLogger("asyncpg").setLevel(ERROR)
        getLogger("httpx").setLevel(ERROR)
        getLogger("httpcore.connection").setLevel(ERROR)
        getLogger("httpcore.http11").setLevel(ERROR)
        getLogger("watchdog.observers.inotify_buffer").setLevel(ERROR)

    def use(self, name: str) -> LoggingLogger:
        """Returns a logger with the given name."""
        if name == "main":
            return self.main
        return getLogger(name)
