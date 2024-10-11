from inspect import Parameter
from typing import Any
from langboard.core.routing import SocketRequest, WebSocket
from langboard.core.routing.SocketRouterScope import SocketRouterScope
from langboard.core.utils.String import capitalize_all_words
from pydantic import BaseModel
from .....helpers.mocks import MockSocketifyWebSocket


class ScopeTestModel(BaseModel):
    # Parameter-related
    param_name: str = "param"
    param_type: Any = Parameter.empty
    param_default: Any = Parameter.empty

    # Request-related
    req_route_data: dict = {}
    req_data: dict | list | None = None
    req_from_app: dict | None = None
    req_temp_data: Any = None

    # Expected-related
    expected_type: Any | None = None
    expected: Any = None
    expected_len: int | None = None
    expected_default: Any = None
    expected_default_type: Any | None = None
    is_exception: bool | None = None
    is_async_generator: bool | None = None
    does_use_cache: bool | None = None

    def __str__(self) -> str:
        strs = [
            "Init Model:",
            "\t ScopeTestModel(",
            *[f"\t\t{key}={self[key]}" for key in self.model_fields_set],  # type: ignore
            "\t)",
            "Test Case:",
        ]

        contexts = [("Parameter", "param_"), ("Request", "req_"), ("Expected", "expected_")]

        for name, prefix in contexts:
            values = [
                f"\t\t{self._make_repr_name(key, prefix)}: {self[key]}"  # type: ignore
                for key in self.model_fields_set
                if key.startswith(prefix)
            ]

            if values:
                strs.append(f"\t- {name}:")
                strs.extend(values)

        return "\n".join(strs)

    def __repr__(self) -> str:
        return self.__str__()

    def create_parameter(self):
        return Parameter(
            self.param_name,
            Parameter.POSITIONAL_OR_KEYWORD,
            annotation=self.param_type,
            default=self.param_default,
        )

    def create_app_request(self) -> SocketRequest:
        websocket = self._mock_websocket()
        return SocketRequest(WebSocket(websocket), self.req_route_data, self.req_data, from_app=self.req_from_app)

    def create_scope(self, event_details: dict[str, str]):
        parameter = self.create_parameter()
        return SocketRouterScope(self.param_name, parameter, event_details)

    def _make_repr_name(self, name: str, remove: str | None = None) -> str:
        return capitalize_all_words((name.replace(remove, "") if remove else name).replace("_", " "))

    def _mock_websocket(self) -> MockSocketifyWebSocket:
        return MockSocketifyWebSocket()
