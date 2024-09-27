from langboard.core.utils.decorators import staticclass
from pytest import raises


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


class TestStaticClass:
    def test_throw_exception_when_method_is_not_decorated_with_staticmethod(self):
        with raises(RuntimeError) as e:

            @staticclass
            class WrongMethodStaticClass:
                def test():
                    pass

            WrongMethodStaticClass.test()

        assert e.value.args[0] == "WrongMethodStaticClass.test: This method must be decorated with @staticmethod"

    def test_throw_exception_when_static_class_is_instantiated(self):
        initializes = [StaticClass, StaticClass.__new__, StaticClass.__init__]

        for initialize in initializes:
            with raises(RuntimeError) as e:
                initialize()

            assert e.value.args[0] == "StaticClass: Cannot instantiate a static class"
