from langboard.core.utils.decorators import class_instance


@class_instance("arg1", arg2="arg2")
class ClassInstance:
    __test__ = False

    def __init__(self, arg1: str, arg2: str):
        self.arg1 = arg1
        self.arg2 = arg2


class TestClassInstance:
    def test_instance(self):
        instance = ClassInstance

        assert isinstance(instance, ClassInstance.__class__)
        assert instance.arg1 == "arg1"
        assert instance.arg2 == "arg2"
