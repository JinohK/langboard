from langboard.core.routing.Exception import SocketRouterScopeException
from pydantic import BaseModel
from pydantic_core import ValidationError
from .....helpers.mocks import MockSocketifyWebSocket
from .BaseScopeTest import BaseScopeTest
from .ScopeTestModel import ScopeTestModel


class TestModel(BaseModel):
    __test__ = False
    test: str
    test2: int


class ModelScope(BaseScopeTest):
    def test_model_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        models = [
            ScopeTestModel(
                param_name="test_model",
                param_type=TestModel,
                req_data={"test": "test", "test2": 2},
                expected_type=TestModel,
                expected={"test": "test", "test2": 2},
            ),
            ScopeTestModel(
                param_name="test_model",
                param_type=TestModel,
                req_data={"test": "test"},
                expected_type=ValidationError,
                expected_len=1,
                expected=[
                    {
                        "type": "missing",
                        "loc": ("test2",),
                        "msg": "Field required",
                        "input": {"test": "test"},
                    }
                ],
                is_exception=True,
            ),
        ]

        for model in models:
            scope = model.create_scope(self._event_details)
            request = self._create_app_request(_mock_socketify_websocket, {}, model.req_data)
            result = scope(request)

            if model.is_exception:
                assert isinstance(result, SocketRouterScopeException)
                assert isinstance(result.raw_exception, model.expected_type)

                errors = result.raw_exception.errors()

                assert len(errors) == model.expected_len
                for i, expected in enumerate(model.expected):
                    for key, value in expected.items():
                        assert errors[i][key] == value
            else:
                assert isinstance(result, model.expected_type)
                assert isinstance(result, TestModel)
                assert result.model_dump() == model.expected
