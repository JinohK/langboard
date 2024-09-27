from threading import Lock
from langboard.core.utils.decorators import thread_safe_singleton
from .....helpers.testing import ThreadSafety


@thread_safe_singleton
class ThreadSafeSingleton:
    __test__ = False

    def __init__(self):
        self._value = 0

    def reset(self):
        self._value = 0

    def increment(self):
        self._value += 1

    def get_value(self):
        return self._value


class TestThreadSafeSingleton(ThreadSafety):
    def test_instance(self):
        assert hasattr(thread_safe_singleton, "__lock__"), "ThreadSafeSingleton does not have __lock__ attribute"
        assert isinstance(
            getattr(thread_safe_singleton, "__lock__"), type(Lock())
        ), "ThreadSafeSingleton.__lock__ is not a Lock instance"

        instance1 = ThreadSafeSingleton()
        instance2 = ThreadSafeSingleton()

        assert instance1 is instance2
        assert hasattr(instance1, "__instance__") and hasattr(
            instance2, "__instance__"
        ), "ThreadSafeSingleton does not have __instance__ attribute"
        assert getattr(instance1, "__instance__") is getattr(instance2, "__instance__")

        instance1.reset()

    def test_thread_safety(self):
        def test(instance: ThreadSafeSingleton):
            instance.increment()

        def get_value(instance: ThreadSafeSingleton) -> int:
            return instance.get_value()

        def reset(instance: ThreadSafeSingleton):
            instance.reset()

        expected_value = 1

        self.assert_thread_safety_with_test(
            cls=ThreadSafeSingleton,
            test=test,
            get_value=get_value,
            reset=reset,
            expected_value=expected_value,
        )
