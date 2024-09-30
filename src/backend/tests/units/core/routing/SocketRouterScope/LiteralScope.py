from enum import Enum
from types import NoneType
from typing import Literal
from langboard.core.routing.Exception import SocketRouterScopeException
from langboard.core.routing.SocketRouterScope import SocketRouterScope
from pytest import raises
from .BaseScopeTest import BaseScopeTest
from .ScopeTestModel import ScopeTestModel


class TestEnum(Enum):
    __test__ = False
    Key1 = "Value1"
    Key2 = "Value2"
    Key3 = "Value3"
    Key4 = "Value4"


class TestInstance:
    __test__ = False

    def __str__(self):
        return "TestInstance"

    def __repr__(self):
        return str(self)


class LiteralScope(BaseScopeTest):
    def test_throw_exception_when_literal_type_value_is_not_allowed(self):
        model = ScopeTestModel(
            param_type=Literal[TestInstance()],
            req_data={"param": TestInstance()},
            expected_type=TypeError,
            expected="Literal type arguments must be a value of int, None, Enum, str, bool, bytes but got TestInstance.",
        )

        with raises(TypeError) as e:
            SocketRouterScope(model.param_name, model.create_parameter(), self._event_details)

        assert isinstance(e.value, model.expected_type)
        assert e.value.args[0] == model.expected

    def test_literal_scope(self):
        literal_type_without_none = Literal[5, True, "str", b"bytes", TestEnum.Key3]
        literal_type_with_none = Literal[3, False, "str", b"bytes", TestEnum.Key2, None]

        models = [
            ScopeTestModel(
                param_type=literal_type_without_none,
                req_temp_data=[5, True, "str", b"bytes", "Key3"],
                expected_type=[int, bool, str, bytes, TestEnum],
                expected=[5, True, "str", b"bytes", TestEnum.Key3],
            ),
            ScopeTestModel(
                param_type=literal_type_with_none,
                req_temp_data=[3, False, "str", b"bytes", "Key2", None],
                expected_type=[int, bool, str, bytes, TestEnum, NoneType],
                expected=[3, False, "str", b"bytes", TestEnum.Key2, None],
            ),
            ScopeTestModel(
                param_type=literal_type_without_none,
                req_temp_data=[4, False, "not_str", "not_bytes", "Key4"],
                expected_type=[TypeError, TypeError, TypeError, TypeError, TypeError],
                expected=[
                    "Parameter 'param' must be one of (5, True, 'str', b'bytes', <TestEnum.Key3: 'Value3'>).",
                    "Parameter 'param' must be one of (5, True, 'str', b'bytes', <TestEnum.Key3: 'Value3'>).",
                    "Parameter 'param' must be one of (5, True, 'str', b'bytes', <TestEnum.Key3: 'Value3'>).",
                    "Parameter 'param' must be one of (5, True, 'str', b'bytes', <TestEnum.Key3: 'Value3'>).",
                    "Parameter 'param' must be one of (5, True, 'str', b'bytes', <TestEnum.Key3: 'Value3'>).",
                ],
            ),
        ]

        for model in models:
            for i in range(len(model.req_temp_data)):
                req_temp_data = model.req_temp_data[i]
                expected_type = model.expected_type[i]
                expected = model.expected[i]

                model.req_data = {"param": req_temp_data}

                request = model.create_app_request()
                scope = model.create_scope(self._event_details)
                result = scope(request)

                if issubclass(expected_type, Exception):
                    assert isinstance(result, SocketRouterScopeException)
                    assert isinstance(result.raw_exception, expected_type)
                    assert result.raw_exception.args[0] == expected
                else:
                    assert isinstance(result, expected_type)
                    assert result == expected
