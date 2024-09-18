from typing import TypeVar


__all__ = ["singleton"]

_TClass = TypeVar("_TClass", bound=object)


def singleton(cls: type[_TClass]) -> type[_TClass]:
    """Converts a class into a singleton."""

    def get_instance(**kwargs):
        if not hasattr(cls, "__instance__"):
            setattr(cls, "__instance__", cls(**kwargs))
            cls.__init__ = get_instance
        return getattr(cls, "__instance__")

    return get_instance
