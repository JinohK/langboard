from enum import Enum
from inspect import Parameter
from types import NoneType
from typing import Any, Union
from langboard.core.routing.Exception import SocketRouterScopeException
from langboard.core.routing.SocketRouterScope import SocketRouterScope
from .....helpers.mocks import MockSocketifyWebSocket
from .BaseScopeTest import BaseScopeTest
from .ScopeTestModel import ScopeTestModel


class TestEnum(Enum):
    __test__ = False
    Key1 = "Value1"
    Key2 = "Value2"
    Key3 = "Value3"
    Key4 = "Value4"


class UnionScope(BaseScopeTest):
    def test_union_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        req_data = {
            "num": 1,
            "str": "test",
            "bool": True,
            "dict": {"test": "test"},
            "list": [1, 2, 3],
            "bytes": "bytes".encode(),
            "enum1": "Key1",
            "enum2": "Value2",
        }

        request = self._create_app_request(_mock_socketify_websocket, {}, req_data)

        # or bitwise operator will be tested so you just need to add param_type using Union[...]
        models = [
            ScopeTestModel(
                param_name="str",
                param_type=[Union[dict, int, None], Union[int, None, dict], Union[None, dict, int]],
                expected_type=[NoneType, NoneType, NoneType],
                expected=[None, None, None],
            ),
            ScopeTestModel(
                param_name="num",
                param_type=[
                    Union[Any, str, bool, dict, list, bytes, TestEnum],
                    Union[str, bool, dict, list, bytes, TestEnum, Any],
                ],
                expected_type=[int, int],
                expected=[req_data["num"], req_data["num"]],
            ),
            ScopeTestModel(
                param_name="num",
                param_type=[Union[int, str], Union[str, int]],
                expected_type=[int, str],
                expected=[req_data["num"], str(req_data["num"])],
            ),
            ScopeTestModel(
                param_name="str",
                param_type=[Union[int, str], Union[str, int]],
                expected_type=[str, str],
                expected=["test", "test"],
            ),
            ScopeTestModel(
                param_name="bool",
                param_type=[Union[int, str, bool], Union[str, bool, int], Union[bool, int, str]],
                expected_type=[int, str, bool],
                expected=[int(req_data["bool"]), str(req_data["bool"]), req_data["bool"]],
            ),
            ScopeTestModel(
                param_name="dict",
                param_type=[Union[dict, list, str], Union[list, str, dict], Union[str, dict, list]],
                expected_type=[dict, list, str],
                expected=[req_data["dict"], list(req_data["dict"]), str(req_data["dict"])],
            ),
            ScopeTestModel(
                param_name="list",
                param_type=[Union[list, str], Union[str, list]],
                expected_type=[list, str],
                expected=[req_data["list"], str(req_data["list"])],
            ),
            ScopeTestModel(
                param_name="bytes",
                param_type=[Union[bytes, list, str], Union[list, str, bytes], Union[str, bytes, list]],
                expected_type=[bytes, list, str],
                expected=[req_data["bytes"], list(req_data["bytes"]), str(req_data["bytes"])],
            ),
            ScopeTestModel(
                param_name="enum1",
                param_type=[Union[TestEnum, str], Union[str, TestEnum]],
                expected_type=[TestEnum, str],
                expected=[TestEnum.Key1, req_data["enum1"]],
            ),
            ScopeTestModel(
                param_name="enum2",
                param_type=[Union[TestEnum, str], Union[str, TestEnum]],
                expected_type=[TestEnum, str],
                expected=[TestEnum.Key2, req_data["enum2"]],
            ),
            ScopeTestModel(
                param_name="str",
                param_type=[Union[dict, int, TestEnum], Union[int, TestEnum, dict], Union[TestEnum, dict, int]],
                expected_type=[TypeError, TypeError, TypeError],
                expected=[
                    "Parameter 'str' must be of type (<class 'dict'>, <class 'int'>, <enum 'TestEnum'>).",
                    "Parameter 'str' must be of type (<class 'int'>, <enum 'TestEnum'>, <class 'dict'>).",
                    "Parameter 'str' must be of type (<enum 'TestEnum'>, <class 'dict'>, <class 'int'>).",
                ],
            ),
        ]

        for model in models:
            for i in range(len(model.param_type)):
                param_type = model.param_type[i]
                expected_type = model.expected_type[i]  # type: ignore
                expected = model.expected[i]

                bit_or_union_type = None
                for i in range(len(param_type.__args__)):
                    each_type = param_type.__args__[i]
                    if i == 0:
                        bit_or_union_type = each_type
                    else:
                        bit_or_union_type |= each_type

                param = Parameter(model.param_name, Parameter.POSITIONAL_OR_KEYWORD, annotation=param_type)
                bit_or_param = Parameter(
                    model.param_name, Parameter.POSITIONAL_OR_KEYWORD, annotation=bit_or_union_type
                )
                scope = SocketRouterScope(model.param_name, param, self._event_details)
                bit_or_scope = SocketRouterScope(model.param_name, bit_or_param, self._event_details)
                result = scope(request)
                bit_or_result = bit_or_scope(request)

                if issubclass(expected_type, Exception):
                    assert isinstance(result, SocketRouterScopeException)
                    assert isinstance(result.raw_exception, expected_type)
                    assert result.raw_exception.args[0] == expected

                    assert isinstance(bit_or_result, SocketRouterScopeException)
                    assert isinstance(bit_or_result.raw_exception, expected_type)
                    assert bit_or_result.raw_exception.args[0] == expected
                else:
                    assert isinstance(result, expected_type)
                    assert result == expected

                    assert isinstance(bit_or_result, expected_type)
                    assert bit_or_result == expected
