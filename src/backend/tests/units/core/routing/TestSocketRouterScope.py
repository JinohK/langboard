from inspect import signature
from typing import Any, AsyncGenerator, Callable, Generator
from fastapi import Depends as DependsFunc
from fastapi.params import Depends
from langboard.core.routing import SocketRequest, WebSocket
from langboard.core.routing.Exception import SocketRouterScopeException
from langboard.core.routing.SocketRouterScope import SocketRouterScope
from pydantic import BaseModel
from pydantic_core import ValidationError
from pytest import ExceptionInfo, mark, raises
from ....helpers.fixtures import ServerFixture
from ....helpers.mocks import MockSocketifyWebSocket


class TestModel(BaseModel):
    __test__ = False
    test: str
    test2: int


class TestSocketRouterScope(ServerFixture):
    _event_details = {
        "route": "route",
        "event": "event",
        "func": "func",
    }

    def test_throw_exception_when_parameter_kind_is_invalid(self):
        def wrong_func(*args, **kwargs):
            print(args, kwargs)

        errors: list[ExceptionInfo[ValueError]] = []
        params = signature(wrong_func).parameters
        for scope_name in params:
            with raises(ValueError) as e:
                SocketRouterScope(scope_name, params[scope_name], self._event_details)
            errors.append(e)

        for error in errors:
            assert error.value.args[0] == "Cannot use * or ** in the event function parameters."

    def test_throw_exception_when_parameter_annotation_is_empty(self):
        def wrong_func(arg1, arg2):
            print(arg1, arg2)

        errors: dict[str, ExceptionInfo[TypeError]] = {}
        params = signature(wrong_func).parameters
        for scope_name in params:
            with raises(TypeError) as e:
                SocketRouterScope(scope_name, params[scope_name], self._event_details)
            errors[scope_name] = e

        for scope_name in errors:
            error = errors[scope_name]

            assert error.value.args[0] == f"Parameter '{scope_name}' must have a type annotation."

    def test_initialization(self):
        def dependency() -> Generator[int, None, None]:
            yield 1

        def func(arg1: str, arg2: int = 1, arg3: int = DependsFunc(dependency, use_cache=False)):
            print(arg1, arg2, arg3)

        expected_args = {
            "arg1": {
                "annotation": str,
                "use_cache": True,
                "default_type": None,
            },
            "arg2": {
                "annotation": int,
                "use_cache": True,
                "default_type": int,
            },
            "arg3": {
                "annotation": int,
                "use_cache": False,
                "default_type": Depends,
            },
        }

        params = signature(func).parameters
        for scope_name in params:
            scope = SocketRouterScope(scope_name, params[scope_name], self._event_details)
            expected = expected_args[scope_name]

            assert scope._event_details == self._event_details
            assert scope._param_name == scope_name
            assert scope._parameter == params[scope_name]
            assert (
                isinstance(scope._default, expected["default_type"])
                if expected["default_type"]
                else scope._default is None
            )
            assert scope.use_cache == expected["use_cache"]
            assert scope.annotation == expected["annotation"]

    @mark.asyncio
    async def test_depends_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        def plus(num1: int, num2: int) -> Generator[int, None, None]:
            yield num1 + num2

        async def plus_async(num1: int, num2: int) -> AsyncGenerator[int, None]:
            yield num1 + num2

        def func(arg1: int = DependsFunc(plus), arg2: int = DependsFunc(plus_async)):
            print(arg1, arg2)

        params = signature(func).parameters
        scope1 = SocketRouterScope("arg1", params["arg1"], self._event_details)
        scope2 = SocketRouterScope("arg2", params["arg2"], self._event_details)
        request = self._create_app_request(_mock_socketify_websocket, {}, {"num1": 1, "num2": 6})

        result1 = scope1(request)
        result2 = scope2(request)

        assert isinstance(result1, Generator)
        assert result1.__next__() == 7

        assert isinstance(result2, AsyncGenerator)
        assert await result2.__anext__() == 7

        result1.close()
        await result2.aclose()

    @mark.asyncio
    async def test_request_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        def func(arg: SocketRequest):
            print(arg)

        params = signature(func).parameters
        scope = SocketRouterScope("arg", params["arg"], self._event_details)
        request = self._create_app_request(_mock_socketify_websocket, {}, {})
        result = scope(request)

        assert isinstance(result, SocketRequest)
        assert result == request

    @mark.asyncio
    async def test_websocket_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        def func(arg: WebSocket):
            print(arg)

        params = signature(func).parameters
        scope = SocketRouterScope("arg", params["arg"], self._event_details)
        request = self._create_app_request(_mock_socketify_websocket, {}, {})
        result = scope(request)

        assert isinstance(result, WebSocket)
        assert result == request.socket

    @mark.asyncio
    async def test_model_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        def func(arg: TestModel):
            print(arg)

        params = signature(func).parameters
        scope = SocketRouterScope("arg", params["arg"], self._event_details)
        request = self._create_app_request(_mock_socketify_websocket, {}, {"test": "test", "test2": 2})
        result = scope(request)

        assert isinstance(result, TestModel)
        assert result.model_dump() == request.data

        error_request = self._create_app_request(_mock_socketify_websocket, {}, {"test": "test"})
        result = scope(error_request)

        assert isinstance(result, SocketRouterScopeException)
        assert isinstance(result.raw_exception, ValidationError)

        errors = result.raw_exception.errors()

        assert len(errors) == 1
        assert errors[0]["type"] == "missing"
        assert errors[0]["loc"] == ("test2",)
        assert errors[0]["msg"] == "Field required"
        assert errors[0]["input"] == {"test": "test"}

    @mark.asyncio
    async def test_data_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        def data_list_func(data: list, route_data: dict):
            print(data, route_data)

        def data_dict_func(data: dict, not_existed: dict, num: int):
            print(data, not_existed, num)

        # function, parameter, request route data, request data, request from_app, expected type, expected, expected_exception_message
        test_cases: list[tuple[Callable, str, dict, dict | list, dict | None, type | None, Any | None, str | None]] = [
            (data_list_func, "data", {}, [1, 2, 3], None, list, [1, 2, 3], None),
            (data_list_func, "data", {}, {"data": [1, 2, 3]}, None, list, [1, 2, 3], None),
            (data_list_func, "data", {}, {"a": 1, "b": 2, "c": 3}, None, None, None, None),
            (data_list_func, "data", {}, {}, {"data": [1, 2, 3]}, list, [1, 2, 3], None),
            (data_list_func, "route_data", {"test": "test"}, {}, None, dict, {"test": "test"}, None),
            (
                data_list_func,
                "route_data",
                {"route_data": {"route": "route"}},
                {},
                None,
                dict,
                {"route": "route"},
                None,
            ),
            (data_list_func, "route_data", {}, {"route_data": {"data": "data"}}, None, dict, {"data": "data"}, None),
            (data_dict_func, "data", {}, {"test": "test"}, None, dict, {"test": "test"}, None),
            (data_dict_func, "data", {}, [], None, None, None, None),
            (data_dict_func, "not_existed", {}, {}, None, None, None, None),
            (
                data_dict_func,
                "num",
                {},
                {"num": "not number"},
                None,
                "exception",
                "\tRoute: route\n\tEvent: event\n\tFunction: func\n\tParameter: num\n\tException:\n{formatted_exception}\n",
                "ValueError: invalid literal for int() with base 10: 'not number'",
            ),
        ]

        for (
            func,
            param_name,
            req_route_data,
            req_data,
            req_from_app,
            expected_type,
            expected,
            expected_exception_message,
        ) in test_cases:
            param = signature(func).parameters[param_name]
            scope = SocketRouterScope(param_name, param, self._event_details)
            from_app = req_from_app or {}
            request = self._create_app_request(
                _mock_socketify_websocket,
                req_route_data,
                req_data,
                from_app,
            )
            result = scope(request)

            expected_type = expected_type

            assertion_failed_message = "\n\t".join(
                [
                    "Test case:",
                    f"\tFunction: {func.__name__}",
                    f"\tParameter: {param_name}",
                    f"\tRequest route data: {req_route_data}",
                    f"\tRequest data: {req_data}",
                    f"\tRequest from_app: {from_app}",
                    f"\tExpected type: {expected_type}",
                    f"\tExpected: {expected}",
                    "Result:",
                    str(result),
                ]
            )

            if expected_type is None:
                assert result is None, assertion_failed_message
            elif expected_type == "exception":
                assert isinstance(result, SocketRouterScopeException), assertion_failed_message

                expected: str = expected.format(formatted_exception=result._formatted_exception)

                assert str(result) == expected, assertion_failed_message
                assert expected.count(expected_exception_message) == 1, assertion_failed_message
            else:
                assert isinstance(result, expected_type), assertion_failed_message
                assert result == expected, assertion_failed_message
