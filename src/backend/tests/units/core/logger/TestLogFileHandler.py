from datetime import datetime
from io import TextIOWrapper
from logging import NOTSET, LogRecord, getLevelNamesMapping
from os.path import dirname
from pathlib import Path
from unittest.mock import Mock, patch
from langboard.core.logger.LogFileHandler import LogFileHandler
from langboard.core.utils.String import concat


class TestLogFileHandler:
    @classmethod
    def setup_class(self):
        self._levels = getLevelNamesMapping()
        self._log_dir = Path(dirname(__file__)) / ".." / ".." / ".." / "logs"

    def test_initialization(self):
        for level_name in self._levels:
            level = self._levels[level_name]
            handler = LogFileHandler(level=level, log_dir=self._log_dir)

            assert handler.level == level
            assert handler._log_dir == self._log_dir
            assert handler._get_log_file_name() == "{:%Y-%m-%d}.log".format(datetime.now())

            del handler

    @patch("langboard.core.logger.LogFileHandler.LogFileHandler._get_log_file_name")
    def test_creates_and_writes_to_log_file(self, mock_get_log_file_name: Mock):
        test_log_file_name = "TestlogFileHandler.log"
        mock_get_log_file_name.return_value = test_log_file_name

        lineno = 1
        lines = []
        log_file = self._log_dir / test_log_file_name

        for handler_level_name in self._levels:
            handler_level = self._levels[handler_level_name]
            handler = LogFileHandler(level=handler_level, log_dir=self._log_dir)

            assert handler._stream is None
            assert handler._stream_path is None

            for record_level_name in self._levels:
                record_level = self._levels[record_level_name]
                record_line = f"[b]test {lineno}[/b]"
                expected_line = f"test {lineno}"
                log_record = LogRecord("test", record_level, __file__, lineno, record_line, None, None)

                handler.emit(log_record)

                if record_level < handler_level:
                    continue

                lines.append(expected_line)
                lineno += 1

                assert isinstance(handler._stream, TextIOWrapper), "handler._stream is not a TextIOWrapper"
                assert handler._stream_path == log_file, f"handler._stream_path is not {log_file}"
                assert log_file.exists(), f"{log_file} does not exist"
                assert log_file.read_text() == concat("\n".join(lines), "\n"), "log file content is not as expected"

            handler._stream.close()
            del handler

        log_file.unlink()

        assert log_file.exists() is False

    @patch("langboard.core.logger.LogFileHandler.LogFileHandler._get_log_file_name")
    def test_creates_new_log_file_when_date_changes(self, mock_get_log_file_name: Mock):
        now = datetime.now()
        now_log_file = "TestLogFileHandler_{:%Y-%m-%d}.log".format(now)
        mock_get_log_file_name.return_value = now_log_file
        handler = LogFileHandler(level=NOTSET, log_dir=self._log_dir)

        record_line = "test"
        log_record = LogRecord("test", NOTSET, __file__, 1, record_line, None, None)

        assert handler._stream_path is None

        handler.emit(log_record)
        now_stream = handler._stream

        assert handler._stream_path == self._log_dir / now_log_file

        # Change the date
        next_date = now.replace(day=now.day + 1)
        next_log_file = "TestLogFileHandler_{:%Y-%m-%d}.log".format(next_date)
        mock_get_log_file_name.return_value = next_log_file

        handler.emit(log_record)
        next_stream = handler._stream

        assert handler._stream_path != self._log_dir / now_log_file
        assert handler._stream_path == self._log_dir / next_log_file
        assert now_stream.closed, "now_stream is not closed"
        assert now_stream != next_stream

        next_stream.close()
        del handler

        (self._log_dir / now_log_file).unlink()
        (self._log_dir / next_log_file).unlink()
