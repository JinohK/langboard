from typing import Any
from langboard.core.schema import DotDict
from pytest import mark, raises


class TestDotDict:
    @mark.parametrize(
        "initial,expected", [({}, {}), ({"key": 1}, {"key": 1}), ({"key": 1, "key2": 2}, {"key": 1, "key2": 2})]
    )
    def test_initialization(self, initial: dict[str, int], expected: dict[str, int]):
        dotdict_type = DotDict[str, int]

        assert issubclass(dotdict_type, dict), "DotDict is not a subclass of dict"

        data = dotdict_type(initial)

        assert data == expected

    def test_get(self):
        data = DotDict({"key": 1, "dict_key": {"key": 2}})

        assert data.key == 1

        # dict_key will be converted to DotDict
        assert isinstance(data.dict_key, DotDict)
        assert data.dict_key.key == 2
        assert data["non_existent_key"] is None
        assert data.non_existent_key is None

    def test_set(self):
        data = DotDict()

        data.key = 1
        # dict_key will be converted to DotDict
        data.dict_key = {"key": 1}

        assert data == {"key": 1, "dict_key": {"key": 1}}
        assert data.key == 1
        assert isinstance(data.dict_key, DotDict)
        assert data.dict_key == {"key": 1}

    def test_throw_attribute_error_when_delete_key_but_not_found(self):
        data = DotDict[str, int]({"key": 1})

        with raises(AttributeError) as e:
            del data.key2

        assert e.value.args[0] == "'DotDict' object has no attribute 'key2'"

    def test_str_and_repr(self):
        data = DotDict[str, Any]({"key": 1, "dict_key": {"key": 2}})

        expected = "{'key': 1, 'dict_key': {'key': 2}}"

        assert str(data) == expected
        assert repr(data) == expected

    def test_eq(self):
        data = DotDict[str, Any]({"key": 1, "dict_key": {"key": 2}})
        equals = [
            DotDict[str, Any]({"key": 1, "dict_key": {"key": 2}}),
            {"key": 1, "dict_key": {"key": 2}},
        ]

        unequals = [
            DotDict[str, int]({"key": 1}),
            DotDict[str, Any]({"key": 1, "dict_key": {"key": 3}}),
            {"key": 1},
            {"key": 1, "dict_key": {"key": 3}},
            123,
            "123",
        ]

        for equal in equals:
            assert data == equal

        for unequal in unequals:
            assert data != unequal

    def test_copy(self):
        data = DotDict[str, Any]({"key": 1, "dict_key": {"key": 2}})

        # Copy as DotDict
        copied = data.copy()
        copied_with_param = data.copy(as_dict=False)

        # Copy as dict
        copied_as_dict = data.copy(as_dict=True)

        assert copied == copied_with_param == data
        assert copied_as_dict == data
        assert copied is not data
        assert copied_with_param is not data
        assert copied_as_dict is not data
