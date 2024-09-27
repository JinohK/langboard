from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, Callable
from fastapi import Request
from fastapi.responses import JSONResponse
from langboard.core.routing import AppExceptionHandlingRoute
from pydantic import BaseModel
from pytest import fixture, mark


class TestModel(BaseModel):
    __test__ = False
    name: str
    test: int
    test2: str


class TestAppExceptionHandlingRoute:
    @mark.asyncio
    async def test_get_route_handler(self, _create_request: Callable[[str, str, Any], Request]):
        async def endpoint(model: TestModel):
            assert model.name == "test"
            assert model.test == 1
            assert model.test2 == "test2"

            return JSONResponse(content={"status": True})

        for method in ["GET", "POST", "PUT", "DELETE"]:
            route = AppExceptionHandlingRoute("/", endpoint, methods=[method])
            route_handler = route.get_route_handler()
            _request = _create_request(method, "application/json", {"name": "test", "test": 1, "test2": "test2"})
            result = await route_handler(_request)

            assert isinstance(result, JSONResponse)

            success_response: dict[str, Any] = json_loads(result.body.decode())

            assert success_response["status"] is True, "Success response status is not True"

    async def test_get_route_handler_with_request_validation_error(
        self, _create_request: Callable[[str, str, Any], Request]
    ):
        async def endpoint(_: TestModel):
            return JSONResponse(content={"status": True})

        for method in ["GET", "POST", "PUT", "DELETE"]:
            route = AppExceptionHandlingRoute("/", endpoint, methods=[method])
            route_handler = route.get_route_handler()
            _request_with_body = _create_request(method, "application/json", {"name": "test"})
            _request_without_body = _create_request(method, "application/json", None)
            result_with_body = await route_handler(_request_with_body)
            result_without_body = await route_handler(_request_without_body)

            assert isinstance(result_with_body, JSONResponse)
            assert isinstance(result_without_body, JSONResponse)

            failed_response_with_body: dict[str, Any] = json_loads(result_with_body.body.decode())
            failed_response_without_body: dict[str, Any] = json_loads(result_without_body.body.decode())
            errors_with_body: dict[str, Any] = failed_response_with_body["errors"]
            errors_without_body: dict[str, Any] = failed_response_without_body["errors"]

            assert failed_response_with_body["status"] is False, "Failed response with body status is not False"
            assert failed_response_without_body["status"] is False, "Failed response without body status is not False"
            assert len(errors_with_body["missing"]) == 1, "Failed response with body missing field count is not 1"
            assert len(errors_without_body["missing"]) == 0, "Failed response without body missing field count is not 0"
            assert (
                errors_with_body["missing"]["body"].count("test")
                == errors_with_body["missing"]["body"].count("test2")
                == 1
            )

    async def test_get_route_handler_with_exception(self, _create_request: Callable[[str, str, Any], Request]):
        async def endpoint():
            raise Exception("Test exception")

        for method in ["GET", "POST", "PUT", "DELETE"]:
            route = AppExceptionHandlingRoute("/", endpoint, methods=[method])
            route_handler = route.get_route_handler()
            _request = _create_request(method, "application/json", {})

            result = await route_handler(_request)

            assert isinstance(result, JSONResponse)

            failed_response: dict[str, Any] = json_loads(result.body.decode())

            assert failed_response["status"] is False, "Failed response status is not False"
            assert (
                failed_response["message"] == "Internal Server Error"
            ), "Failed response message is not 'Internal Server Error'"

    @fixture
    def _create_request(self) -> Callable[[str, str, Any], Request]:
        def create(method: str, content_type: str, body: Any) -> Request:
            scope = {
                "type": "http",
                "method": method,
                "root_path": "",
                "path": "/",
                "query_string": b"",
                "headers": [("content-type", content_type)],
            }

            async def receive():
                raw_body = None
                if content_type == "application/json":
                    raw_body = json_dumps(body)
                elif content_type == "application/x-www-form-urlencoded":
                    raw_body = "&".join([f"{key}={value}" for key, value in body.items()])
                elif content_type == "text/plain":
                    raw_body = body

                return {"type": "http.request", "body": raw_body.encode()}

            return Request(scope=scope, receive=receive)

        return create
