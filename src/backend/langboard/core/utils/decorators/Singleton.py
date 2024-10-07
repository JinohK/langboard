from typing import TypeVar


_TClass = TypeVar("_TClass", bound=type)


def singleton(cls: _TClass) -> _TClass:
    """Converts a class into a singleton."""

    def get_instance(**kwargs):
        if not hasattr(cls, "__instance__"):
            setattr(cls, "__instance__", cls(**kwargs))
            cls.__init__ = get_instance
            cls.__init__ = get_instance
        return getattr(cls, "__instance__")

    return get_instance
