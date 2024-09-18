from threading import Lock
from typing import TypeVar


__all__ = ["thread_safe_singleton"]

_TClass = TypeVar("_TClass", bound=object)


def thread_safe_singleton(cls: type[_TClass]) -> type[_TClass]:
    """Converts a class into a thread-safe singleton."""
    if not hasattr(thread_safe_singleton, "__lock__"):
        setattr(thread_safe_singleton, "__lock__", Lock())

    def get_instance(**kwargs):
        if not hasattr(cls, "__instance__"):
            with getattr(thread_safe_singleton, "__lock__"):
                if not hasattr(cls, "__instance__"):
                    setattr(cls, "__instance__", cls(**kwargs))
                    cls.__init__ = get_instance
        return getattr(cls, "__instance__")

    return get_instance
