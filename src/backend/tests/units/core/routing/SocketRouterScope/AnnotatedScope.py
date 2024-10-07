from typing import Annotated, AsyncGenerator, Generator
from fastapi import Depends as DependsFunc
from pytest import mark
from .....helpers.mocks import MockSocketifyWebSocket
from .BaseScopeTest import BaseScopeTest
from .ScopeTestModel import ScopeTestModel


class AnnotatedScope(BaseScopeTest):
    @mark.asyncio
    async def test_annotated_scope(self):
        def plus(num1: int, num2: int) -> Generator[int, None, None]:
            yield num1 + num2

        async def plus_async(num1: int, num2: int) -> AsyncGenerator[int, None]:
            yield num1 + num2

        request = self._create_app_request(MockSocketifyWebSocket(), {}, {"num1": 1, "num2": 6, "arg": "test"})

        models = [
            ScopeTestModel(
                param_name="num1",
                param_type=Annotated[int, DependsFunc(plus)],
                expected_type=Generator,
                expected=7,
                is_async_generator=False,
            ),
            ScopeTestModel(
                param_name="num2",
                param_type=Annotated[int, DependsFunc(plus_async)],
                expected_type=AsyncGenerator,
                expected=7,
                is_async_generator=True,
            ),
            ScopeTestModel(
                param_name="arg",
                param_type=Annotated[str, "This metadata will be ignored"],
                expected_type=str,
                expected="test",
            ),
        ]

        for model in models:
            scope = model.create_scope(self._event_details)
            result = scope(request)

            if model.is_async_generator is True:
                assert isinstance(result, AsyncGenerator)
                assert await anext(result) == model.expected
                await result.aclose()
            elif model.is_async_generator is False:
                assert isinstance(result, Generator)
                assert next(result) == model.expected
                result.close()
            else:
                assert isinstance(result, model.expected_type)
                assert result == model.expected
