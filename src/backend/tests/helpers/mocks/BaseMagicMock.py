from abc import ABC
from unittest.mock import MagicMock, Mock


class BaseMagicMock(ABC, MagicMock):
    def reset_all(self):
        for key in self.__dict__:
            target = self.__dict__[key]
            if not isinstance(target, Mock):
                continue
            target.reset_mock()
