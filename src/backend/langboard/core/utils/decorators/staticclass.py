from typing import TypeVar


_T = TypeVar("_T", bound=object)


def staticclass(cls: _T) -> _T:
    """Decorator to make a class static"""

    def throw_exception(*args, **kwargs):
        raise TypeError(f"{cls.__name__}: Cannot instantiate a static class")

    cls.__new__ = throw_exception
    cls.__init__ = throw_exception
    return cls
