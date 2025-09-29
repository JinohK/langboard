from core.caching import Cache
from core.routing import AppRouter
from fastapi.responses import JSONResponse


@AppRouter.api.get("/health")
async def health_check():
    return JSONResponse(content={"status": "ok"})


@AppRouter.api.get("/bot/status/map")
async def bot_status_map(project_uid: str):
    status_map = await Cache.get("bot.status.map")
    status_map = status_map.get(project_uid, {}) if status_map else {}
    return JSONResponse(content={"status_map": status_map})
