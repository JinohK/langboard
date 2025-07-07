from core.Env import Env
from core.FastAPIAppConfig import FastAPIAppConfig
from core.routing import AppExceptionHandlingRoute, AppRouter, BaseMiddleware
from core.security import AuthSecurity
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from .ai import BotScheduleHelper
from .Constants import APP_CONFIG_FILE, SCHEMA_DIR
from .Loader import ModuleLoader
from .middlewares import AuthMiddleware, RoleMiddleware


class App:
    api: FastAPI

    def __init__(self):
        self.app_config = FastAPIAppConfig(APP_CONFIG_FILE)
        self.config = self.app_config.load()
        self.api = FastAPI(debug=True)
        self._init_api_middlewares()
        self._init_api_routes()

        AppRouter.set_openapi_schema(self.api)
        AuthSecurity.set_openapi_schema(self.api)
        AppRouter.create_schema_file(self.api, SCHEMA_DIR / "openapi.json")
        AppRouter.set_app(self.api)

    def create(self):
        AppRouter.set_app(self.api)
        BotScheduleHelper.reload_cron()
        self.app_config.set_restarting(True)
        return self.api

    def _init_api_middlewares(self):
        origins = [Env.PUBLIC_UI_URL]
        self.api.add_middleware(RoleMiddleware, routes=self.api.routes)
        self.api.add_middleware(AuthMiddleware, routes=self.api.routes)
        self.api.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=5)
        self.api.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
            allow_headers=[
                "Accept",
                "Referer",
                "Accept-Encoding",
                "Accept-Language",
                "Content-Encoding",
                "Content-Language",
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "User-Agent",
                "X-Forwarded-Proto",
                "X-Forwarded-Host",
                "X-Real-IP",
                AuthSecurity.IP_HEADER,
            ],
        )

        middleware_modules = ModuleLoader.load(
            "middlewares", "Middleware", BaseMiddleware, not self.config.is_restarting
        )
        for module in middleware_modules.values():
            for middleware in module:
                if middleware.__auto_load__:
                    self.api.add_middleware(middleware)

    def _init_api_routes(self):
        self.api.router.route_class = AppExceptionHandlingRoute
        ModuleLoader.load("routes", "Api", log=not self.config.is_restarting)
        self.api.include_router(AppRouter.api)
