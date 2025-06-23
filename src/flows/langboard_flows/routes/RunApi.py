from json import loads as json_loads
from core.db import DbSession, SqlBuilder
from core.routing import AppRouter
from core.types import SnowflakeID
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from langflow.load import aload_flow_from_json
from models.InternalBot import InternalBot
from ..core.flows import FlowRunner
from ..core.logger import Logger
from ..core.schema import FlowRequestModel
from ..core.schema.Exception import APIException, InvalidChatInputError


@AppRouter.api.post("/api/v1/run/{anypath}")
async def run_flow(api_request: FlowRequestModel, stream: bool = False):
    setting = None
    with DbSession.use(readonly=True) as db:
        result = db.exec(
            SqlBuilder.select.table(InternalBot).where(
                (InternalBot.id == SnowflakeID.from_short_code(api_request.setting_uid))
            )
        )

        setting = result.first()

    if not setting:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"error": "Setting not found"})

    graph = await aload_flow_from_json(flow=json_loads(setting.value), tweaks=api_request.tweaks)

    runner = FlowRunner(graph, api_request, stream)

    if runner.stream:
        result = await runner.run_stream()
        main_task, response_generator = result

        async def on_disconnect() -> None:
            Logger.main.debug("Client disconnected, closing tasks")
            main_task.cancel()

        return StreamingResponse(response_generator, background=on_disconnect, media_type="text/event-stream")  # type: ignore

    try:
        result = await runner.run()

    except ValueError as exc:
        if "badly formed hexadecimal UUID string" in str(exc):
            # This means the Flow ID is not a valid UUID which means it can't find the flow
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        if "not found" in str(exc):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        raise APIException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, exception=exc) from exc
    except InvalidChatInputError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise APIException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, exception=exc) from exc

    return result
