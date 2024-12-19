from enum import Enum
from langboard.core.routing.Exception import SocketManagerScopeException
from .BaseScopeTest import BaseScopeTest
from .ScopeTestModel import ScopeTestModel


class TestEnum(Enum):
    __test__ = False
    Key1 = "Value1"
    Key2 = "Value2"
    Key3 = "Value3"
    Key4 = "Value4"


class EnumScope(BaseScopeTest):
    def test_enum_scope(self):
        model_data = [
            ("Key1", TestEnum.Key1),
            ("Key2", TestEnum.Key2),
            ("Key3", TestEnum.Key3),
            ("Key4", TestEnum.Key4),
            ("Value1", TestEnum.Key1),
            ("Value2", TestEnum.Key2),
            ("Value3", TestEnum.Key3),
            ("Value4", TestEnum.Key4),
        ]

        for data, expected in model_data:
            model = ScopeTestModel(
                param_name="enum",
                param_type=TestEnum,
                req_data=[data],
                expected=expected,
            )

            request = model.create_app_request()
            scope = model.create_scope(self._event_details)
            result = scope(request)

            assert isinstance(result, SocketManagerScopeException)
            assert isinstance(result.raw_exception, TypeError)
            assert result.raw_exception.args[0] == f"Parameter 'enum' must be a dict but got {model.req_data}"

        for data, expected in model_data:
            model = ScopeTestModel(
                param_name="enum",
                param_type=TestEnum,
                req_data={"enum": data},
                expected=expected,
            )

            request = model.create_app_request()
            scope = model.create_scope(self._event_details)
            result = scope(request)

            assert isinstance(result, TestEnum)
            assert result == model.expected
