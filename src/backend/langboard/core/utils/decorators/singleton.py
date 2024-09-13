from typing import TypeVar
from threading import Lock


__all__ = ["singleton", "thread_safe_singleton"]

_T = TypeVar("_T", bound=object)


def singleton(cls: _T) -> _T:
    """Converts a class into a singleton."""

    def get_instance(**kwargs):
        if not hasattr(cls, "__instance__"):
            setattr(cls, "__instance__", cls(**kwargs))
        return getattr(cls, "__instance__")

    return get_instance


def thread_safe_singleton(cls: _T) -> _T:
    """Converts a class into a thread-safe singleton."""
    if not hasattr(thread_safe_singleton, "__lock__"):
        setattr(thread_safe_singleton, "__lock__", Lock())

    def get_instance(**kwargs):
        if not hasattr(cls, "__instance__"):
            with getattr(thread_safe_singleton, "__lock__"):
                if not hasattr(cls, "__instance__"):
                    setattr(cls, "__instance__", cls(**kwargs))
        return getattr(cls, "__instance__")

    return get_instance
