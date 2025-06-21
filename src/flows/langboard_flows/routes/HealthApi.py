from core.routing import AppRouter
from fastapi.responses import JSONResponse


@AppRouter.api.get("/health")
async def health_check():
    return JSONResponse(content={"status": "ok"})
