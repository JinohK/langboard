from logging import ERROR, getLogger
from langboard.Constants import PROJECT_NAME
from langboard.core.logger import Logger


class TestLogger:
    def test_initialization(self):
        assert Logger.main.name == PROJECT_NAME
        assert getLogger("asyncio").level == ERROR
        assert getLogger("multipart").level == ERROR

    def test_use(self):
        assert Logger.use("main") == Logger.main
        assert Logger.use("test") == getLogger("test")
