from abc import ABC, abstractmethod
from typing import Any


class BaseFilter(ABC):
    def __init__(self):
        self._filtered: set[Any] = set()

    @abstractmethod
    def add(self, data: Any) -> Any:
        """Adds a data to be filtered.

        You can use as a decorator.

        :param data: Data to be filtered
        """

    @abstractmethod
    def exists(self, data: Any) -> bool:
        """Checks if a data is in the filter.

        :param data: Data to be checked
        """
