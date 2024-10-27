from logging import NOTSET, Handler, LogRecord
from pathlib import Path
from typing import Optional, TextIO
from rich.text import Text
from ...Constants import LOGGING_DIR
from ..utils.DateTime import now
from ..utils.String import concat


class LogFileHandler(Handler):
    """A custom logging handler that writes logs to a file."""

    def __init__(self, level: int = NOTSET, log_dir: str | Path = LOGGING_DIR):
        Handler.__init__(self, level)
        self._log_dir = Path(log_dir)
        self._stream: Optional[TextIO] = None
        self._stream_path: Optional[Path] = None

        self._log_dir.mkdir(parents=True, exist_ok=True)

    def emit(self, record: LogRecord):
        if record.levelno < self.level:
            return

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
        return "{:%Y-%m-%d}.log".format(now())
