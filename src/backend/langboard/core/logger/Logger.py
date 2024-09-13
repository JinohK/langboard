from logging import (
    ERROR,
    Handler,
    LogRecord,
    Logger as LoggingLogger,
    basicConfig,
    getLevelNamesMapping,
    getLogger,
    NOTSET,
)
from pathlib import Path
from typing import Optional, TextIO, overload
from rich.text import Text
from rich.logging import RichHandler
from datetime import datetime
from ...constants import ENVIRONMENT, LOGGING_DIR, LOGGING_LEVEL, PROJECT_NAME
from ..utils.decorators import thread_safe_singleton
from ..utils.string import concat


class LogFileHandler(Handler):
    """A custom logging handler that writes logs to a file."""

    def __init__(self, level: int = NOTSET, log_dir: str | Path = LOGGING_DIR):
        Handler.__init__(self, level)
        self._log_dir = Path(log_dir)
        self._stream: Optional[TextIO] = None
        self._stream_path: Optional[Path] = None

    def emit(self, record: LogRecord):
        log_file = self._log_dir / self._get_log_file_name()
        if str(self._stream_path) != str(log_file) and self._stream:
            self._stream.close()
            self._stream = None

        if not self._stream:
            self._stream = open(log_file, "a", buffering=1)
            self._stream_path = log_file

        self._stream.write(Text.from_markup(concat(self.format(record), "\n")).plain)
        self._stream.flush()
        pass

    def _get_log_file_name(self):
        return "{:%Y-%m-%d}.log".format(datetime.now())


@thread_safe_singleton
class Logger:
    """Manages the application's logging."""

    main: LoggingLogger

    def __init__(self):
        levels = getLevelNamesMapping()
        level = (
            levels[LOGGING_LEVEL]
            if LOGGING_LEVEL in levels
            else (levels["ERROR"] if ENVIRONMENT == "production" else levels["DEBUG"])
        )
        basicConfig(
            level=level,
            format="%(asctime)s %(name)s: %(message)s",
            datefmt="[%Y-%m-%d %X]",
            handlers=[
                RichHandler(level=level, markup=True, rich_tracebacks=True, tracebacks_show_locals=True),
                LogFileHandler(),
            ],
        )
        self.main = getLogger(PROJECT_NAME)
        getLogger("multipart").setLevel(ERROR)

    @overload
    @staticmethod
    def use(name: str) -> LoggingLogger: ...
    def use(self, name: str) -> LoggingLogger:
        """Returns a logger with the given name."""
        if name == "main":
            return self.main
        return getLogger(name)


Logger = Logger()
