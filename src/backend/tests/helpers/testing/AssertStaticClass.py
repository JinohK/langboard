from typing import TypeVar
from pytest import raises


_TClass = TypeVar("_TClass")


class AssertStaticClass:
    def assert_throw_exception_when_instantiated(self, cls: type[_TClass]):
        initializes = [cls, cls.__new__, cls.__init__]

        for initialize in initializes:
            with raises(RuntimeError) as e:
                initialize()

            assert e.value.args[0] == f"{cls.__name__}: Cannot instantiate a static class"
