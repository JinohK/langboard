from typing import Callable
from fastapi import HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
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
                errors: dict[str, list] = {}
                raw_errors = e.errors()
                for raw_error in raw_errors:
                    error_type = raw_error["type"]
                    if error_type not in errors:
                        errors[error_type] = []
                    errors[error_type].append(raw_error["loc"])
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST, content={"status": False, "required": errors}
                )
            except Exception as e:
                self._logger.exception(e)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error"}
                )

        return route_handler
