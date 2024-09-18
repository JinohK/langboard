from typing import Callable, TypeVar


_TClass = TypeVar("_TClass", bound=object)


def staticclass(cls: type[_TClass]) -> type[_TClass]:
    """Decorator to make a class static"""

    for name, attr in cls.__dict__.items():
        if not isinstance(attr, Callable) or (name.startswith("__") and name.endswith("__")):
            continue
        if not isinstance(attr, staticmethod):
            raise RuntimeError(f"{cls.__name__}.{name}: This method must be decorated with @staticmethod")

    def throw_exception(*args, **kwargs):
        raise RuntimeError(f"{cls.__name__}: Cannot instantiate a static class")

    cls.__new__ = throw_exception
    cls.__init__ = throw_exception
    return cls
