from typing import TypeVar


_TClass = TypeVar("_TClass", bound=object)


def class_instance(cls: type[_TClass]) -> _TClass:
    """Converts a class into a class instance.

    If you want to declare a variable as the same name as the class in the same module, you can use this decorator.

    This decorator only gives a hint to the linter.

    It does not change the behavior of the class.

    E.g.::

        @class_instance
        class ClassInstance:
            ...

        ClassInstance = ClassInstance()
    """

    return cls
