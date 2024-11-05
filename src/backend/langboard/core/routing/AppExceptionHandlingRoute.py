from typing import Callable
from fastapi import Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from ...core.routing import JsonResponse
from ..logger import Logger


class AppExceptionHandlingRoute(APIRoute):
    """Handles exceptions that occur during the route handling process inherited from :class:`fastapi.routing.APIRoute`."""

    _logger = Logger.main

    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def route_handler(request: Request) -> Response:
            try:
                return await original_route_handler(request)
            except RequestValidationError as e:
                errors: dict[str, dict] = {}
                raw_errors = e.errors()
                for raw_error in raw_errors:
                    error_type = raw_error["type"]
                    if error_type not in errors:
                        errors[error_type] = {}
                    if len(raw_error["loc"]) <= 1:
                        continue

                    where = raw_error["loc"][0]
                    fields = raw_error["loc"][1:]
                    if where not in errors[error_type]:
                        errors[error_type][where] = []
                    errors[error_type][where].extend(fields)
                return JsonResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"errors": errors})
            except Exception as e:
                self._logger.exception(e)
                return JsonResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={"status": False, "message": "Internal Server Error"},
                )

        return route_handler
