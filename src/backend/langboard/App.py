from core.routing import AppExceptionHandlingRoute, AppRouter, BaseMiddleware
from core.security import AuthSecurity
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from .ai import BotScheduleHelper
from .AppConfig import AppConfig
from .Constants import PUBLIC_FRONTEND_URL
from .Loader import load_modules
from .middlewares import AuthMiddleware, RoleMiddleware


class App:
    api: FastAPI

    def __init__(self):
        self.config = AppConfig.load()
        self.api = FastAPI(debug=True)
        self._init_api_middlewares()
        self._init_api_routes()

        AppRouter.set_openapi_schema(self.api)
        AuthSecurity.set_openapi_schema(self.api)
        AppRouter.set_app(self.api)

    def create(self):
        AppRouter.set_app(self.api)
        BotScheduleHelper.reload_cron()
        AppConfig.set_restarting(True)
        return self.api

    def _init_api_middlewares(self):
        origins = [PUBLIC_FRONTEND_URL]
        self.api.add_middleware(RoleMiddleware, routes=self.api.routes)
        self.api.add_middleware(AuthMiddleware, routes=self.api.routes)
        self.api.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=5)
        self.api.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
        middleware_modules = load_modules("middlewares", "Middleware", BaseMiddleware, not self.config.is_restarting)
        for module in middleware_modules.values():
            for middleware in module:
                if middleware.__auto_load__:
                    self.api.add_middleware(middleware)

    def _init_api_routes(self):
        self.api.router.route_class = AppExceptionHandlingRoute
        load_modules("routes", "Api", log=not self.config.is_restarting)
        load_modules("routes", "Socket", log=not self.config.is_restarting)
        self.api.include_router(AppRouter.api)
