from inspect import signature
from types import NoneType
from typing import Generator
from fastapi import Depends as DependsFunc
from fastapi.params import Depends
from langboard.core.routing import SocketRequest, WebSocket
from langboard.core.routing.SocketRouterScope import SocketRouterScope
from pytest import ExceptionInfo, mark, raises
from ....helpers.mocks import MockSocketifyWebSocket
from .SocketRouterScope import (
    AnnotatedScope,
    DataScope,
    DependsScope,
    EnumScope,
    LiteralScope,
    ModelScope,
    ScopeTestModel,
    UnionScope,
)


class TestSocketRouterScope(AnnotatedScope, DataScope, DependsScope, EnumScope, LiteralScope, ModelScope, UnionScope):
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
        models = [
            ScopeTestModel(param_name="arg1"),
            ScopeTestModel(param_name="arg2"),
            ScopeTestModel(param_name="arg3"),
        ]

        errors: dict[str, ExceptionInfo[TypeError]] = {}

        for model in models:
            param = model.create_parameter()
            with raises(TypeError) as e:
                SocketRouterScope(model.param_name, param, self._event_details)
            errors[model.param_name] = e

        for scope_name in errors:
            error = errors[scope_name]

            assert error.value.args[0] == f"Parameter '{scope_name}' must have a type annotation."

    def test_initialization(self):
        def dependency() -> Generator[int, None, None]:
            yield 1

        depends_with_cache = DependsFunc(dependency, use_cache=True)
        depends_without_cache = DependsFunc(dependency, use_cache=False)

        models = [
            ScopeTestModel(
                param_name="arg1",
                param_type=str,
                expected_default=None,
                expected_default_type=NoneType,
                does_use_cache=True,
            ),
            ScopeTestModel(
                param_name="arg2",
                param_type=int,
                param_default=1,
                expected_default=1,
                expected_default_type=int,
                does_use_cache=True,
            ),
            ScopeTestModel(
                param_name="arg3",
                param_type=int,
                param_default=depends_with_cache,
                expected_default=depends_with_cache,
                expected_default_type=Depends,
                does_use_cache=True,
            ),
            ScopeTestModel(
                param_name="arg3",
                param_type=int,
                param_default=depends_without_cache,
                expected_default=depends_without_cache,
                expected_default_type=Depends,
                does_use_cache=False,
            ),
        ]

        for model in models:
            param = model.create_parameter()
            scope = SocketRouterScope(model.param_name, param, self._event_details)

            assert scope._event_details == self._event_details
            assert scope._param_name == param.name
            assert scope._parameter == param
            assert isinstance(scope._default, model.expected_default_type)  # type: ignore
            assert scope._default == model.expected_default
            assert scope.use_cache == model.does_use_cache
            assert scope.annotation == model.param_type

    @mark.asyncio
    async def test_request_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        request = self._create_app_request(_mock_socketify_websocket, {}, {})
        model = ScopeTestModel(param_name="req", param_type=SocketRequest, expected=request)

        scope = model.create_scope(self._event_details)
        result = scope(request)

        assert isinstance(result, SocketRequest)
        assert result == model.expected

    @mark.asyncio
    async def test_websocket_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        request = self._create_app_request(_mock_socketify_websocket, {}, {})
        model = ScopeTestModel(param_name="socket", param_type=WebSocket, expected=request.socket)

        scope = model.create_scope(self._event_details)
        result = scope(request)

        assert isinstance(result, WebSocket)
        assert result == model.expected
