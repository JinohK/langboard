from langboard.core.utils.decorators import singleton


@singleton
class Singleton:
    __test__ = False

    def __init__(self):
        self._value = 0

    def increment(self):
        self._value += 1

    def get_value(self):
        return self._value


class TestSingleton:
    def test_instance(self):
        instance1 = Singleton()
        instance2 = Singleton()

        assert instance1 is instance2
        assert hasattr(instance1, "__instance__") and hasattr(
            instance2, "__instance__"
        ), "Singleton does not have __instance__ attribute"
        assert getattr(instance1, "__instance__") is getattr(instance2, "__instance__")

    def test_shared_state(self):
        instance1 = Singleton()
        instance2 = Singleton()

        instance1.increment()
        assert instance1.get_value() == instance2.get_value() == 1

        instance2.increment()
        assert instance2.get_value() == instance1.get_value() == 2
