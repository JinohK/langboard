from os import cpu_count
from threading import Thread
from typing import Any, Callable, TypeVar


_TClass = TypeVar("_TClass")


class ThreadSafety:
    def assert_thread_safety_with_test(
        self,
        cls: type[_TClass],
        test: Callable[[_TClass], None],
        get_value: Callable[[_TClass], Any],
        reset: Callable[[_TClass], None],
        expected_value: Any,
    ):
        _, instances = self._create_instances(cls)

        test(instances[0])

        for instance in instances:
            assert id(instance) == id(instances[0])
            assert instance is instances[0]
            assert get_value(instance) == get_value(instances[0]) == expected_value

        reset(instances[0])

    def assert_thread_safety(self, cls: type[_TClass]):
        _, instances = self._create_instances(cls)

        for instance in instances:
            assert id(instance) == id(instances[0])
            assert instance is instances[0]

    def _create_instances(self, cls: type[_TClass]) -> tuple[list[Thread], list[_TClass]]:
        threads: list[Thread] = []
        instances: list[_TClass] = []

        def append_result(target: list):
            target.append(cls())

        for _ in range(cpu_count() or 1):
            thread = Thread(target=append_result, args=(instances,))
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()

        assert len(instances) == cpu_count() or 1

        return threads, instances
