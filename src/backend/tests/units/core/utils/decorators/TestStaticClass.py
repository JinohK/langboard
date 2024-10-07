from langboard.core.utils.decorators import staticclass
from pytest import raises
from .....helpers.testing import AssertStaticClass


@staticclass
class StaticClass:
    __test__ = False
    _value = 0

    @staticmethod
    def increment():
        StaticClass._value += 1

    @staticmethod
    def get_value():
        return StaticClass._value


class TestStaticClass(AssertStaticClass):
    def test_throw_exception_when_method_is_not_decorated_with_staticmethod(self):
        with raises(RuntimeError) as e:

            @staticclass
            class WrongMethodStaticClass:
                def test():
                    pass

            WrongMethodStaticClass.test()

        assert e.value.args[0] == "WrongMethodStaticClass.test: This method must be decorated with @staticmethod"

    def test_throw_exception_when_instantiated(self):
        self.assert_throw_exception_when_instantiated(StaticClass)
