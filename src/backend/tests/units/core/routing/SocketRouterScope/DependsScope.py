from typing import AsyncGenerator, Generator
from fastapi import Depends as DependsFunc
from pytest import mark
from .....helpers.mocks import MockSocketifyWebSocket
from .BaseScopeTest import BaseScopeTest
from .ScopeTestModel import ScopeTestModel


class DependsScope(BaseScopeTest):
    @mark.asyncio
    async def test_depends_scope(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        def plus(num1: int, num2: int) -> Generator[int, None, None]:
            yield num1 + num2

        async def plus_async(num1: int, num2: int) -> AsyncGenerator[int, None]:
            yield num1 + num2

        request = self._create_app_request(_mock_socketify_websocket, {}, {"num1": 1, "num2": 6})

        models = [
            ScopeTestModel(
                param_name="num1",
                param_type=int,
                param_default=DependsFunc(plus),
                expected_type=Generator,
                expected=7,
                is_async_generator=False,
            ),
            ScopeTestModel(
                param_name="num2",
                param_type=int,
                param_default=DependsFunc(plus_async),
                expected_type=AsyncGenerator,
                expected=7,
                is_async_generator=True,
            ),
        ]

        for model in models:
            scope = model.create_scope(self._event_details)
            result = scope(request)

            if model.is_async_generator:
                assert isinstance(result, AsyncGenerator)
                assert await result.__anext__() == model.expected
                await result.aclose()
            else:
                assert isinstance(result, Generator)
                assert result.__next__() == model.expected
                result.close()
