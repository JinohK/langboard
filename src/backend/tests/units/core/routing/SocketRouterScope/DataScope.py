from types import NoneType
from typing import Any
from langboard.core.routing.Exception import SocketRouterScopeException
from langboard.core.routing.SocketRouterScope import SocketRouterScope
from pydantic import BaseModel
from .BaseScopeTest import BaseScopeTest
from .ScopeTestModel import ScopeTestModel


class TestModel(BaseModel):
    __test__ = False
    test: str
    test2: int


class DataScope(BaseScopeTest):
    def test_data_scope(self):
        models = [
            ScopeTestModel(
                param_name="data",
                param_type=list,
                req_data=[1, 2, 3],
                expected_type=list,
                expected=[1, 2, 3],
            ),
            ScopeTestModel(
                param_name="data",
                param_type=list,
                req_data={"data": [1, 2, 3]},
                expected_type=list,
                expected=[1, 2, 3],
            ),
            ScopeTestModel(
                param_name="data",
                param_type=list,
                req_data={"a": 1, "b": 2, "c": 3},
                expected_type=NoneType,
                expected=None,
            ),
            ScopeTestModel(
                param_name="data",
                param_type=list,
                req_route_data={"data": [1, 2, 3]},
                expected_type=list,
                expected=[1, 2, 3],
            ),
            ScopeTestModel(
                param_name="data",
                param_type=list,
                req_from_app={"data": [1, 2, 3]},
                expected_type=list,
                expected=[1, 2, 3],
            ),
            ScopeTestModel(
                param_name="data",
                param_type=dict,
                req_data=[],
                expected_type=NoneType,
                expected=None,
            ),
            ScopeTestModel(
                param_name="data",
                param_type=dict,
                req_data={"test": "test"},
                expected_type=dict,
                expected={"test": "test"},
            ),
            ScopeTestModel(
                param_name="data",
                param_type=dict,
                req_data={"data": {"test": "test"}},
                expected_type=dict,
                expected={"test": "test"},
            ),
            ScopeTestModel(
                param_name="data",
                param_type=dict,
                req_route_data={"data": {"test": "test"}},
                expected_type=dict,
                expected={"test": "test"},
            ),
            ScopeTestModel(
                param_name="data",
                param_type=dict,
                req_from_app={"data": {"test": "test"}},
                expected_type=dict,
                expected={"test": "test"},
            ),
            ScopeTestModel(
                param_name="route_data",
                param_type=dict,
                req_route_data={"test": "test"},
                expected_type=dict,
                expected={"test": "test"},
            ),
            ScopeTestModel(
                param_name="route_data",
                param_type=dict,
                req_route_data={"route_data": {"test": "test"}},
                expected_type=dict,
                expected={"test": "test"},
            ),
            ScopeTestModel(
                param_name="route_data",
                param_type=dict,
                req_data={"route_data": {"test": "test"}},
                expected_type=dict,
                expected={"test": "test"},
            ),
            ScopeTestModel(
                param_name="route_data",
                param_type=dict,
                req_from_app={"route_data": {"test": "test"}},
                expected_type=dict,
                expected={"test": "test"},
            ),
            ScopeTestModel(
                param_name="not_existed",
                param_type=Any,
                expected_type=NoneType,
                expected=None,
            ),
            ScopeTestModel(
                param_name="any_value",
                param_type=Any,
                req_data={"any_value": "any value"},
                expected_type=str,
                expected="any value",
            ),
            ScopeTestModel(
                param_name="any_value",
                param_type=Any,
                req_data={"any_value": 1},
                expected_type=int,
                expected=1,
            ),
            ScopeTestModel(
                param_name="num",
                param_type=int,
                req_data={"num": "not number"},
                expected_type=ValueError,
                expected="invalid literal for int() with base 10: 'not number'",
                is_exception=True,
            ),
            ScopeTestModel(
                param_name="bool",
                param_type=bool,
                req_data={"bool": "not bool"},
                expected_type=NoneType,
                expected=None,
            ),
        ]

        for true_type in SocketRouterScope._BOOL_TRUE_VALUES:
            models.append(
                ScopeTestModel(
                    param_name="bool",
                    param_type=bool,
                    req_data={"bool": true_type},
                    expected_type=bool,
                    expected=True,
                )
            )

        for false_type in SocketRouterScope._BOOL_FALSE_VALUES:
            models.append(
                ScopeTestModel(
                    param_name="bool",
                    param_type=bool,
                    req_data={"bool": false_type},
                    expected_type=bool,
                    expected=False,
                )
            )

        for model in models:
            request = model.create_app_request()
            scope = model.create_scope(self._event_details)
            result = scope(request)

            if model.is_exception:
                assert isinstance(result, SocketRouterScopeException), str(model)
                assert str(result).count(f"{model.expected_type.__name__}: {model.expected}") == 1, str(model)
                assert str(result.raw_exception) == model.expected, str(model)
            else:
                assert isinstance(result, model.expected_type), str(model)
                assert result == model.expected, str(model)
