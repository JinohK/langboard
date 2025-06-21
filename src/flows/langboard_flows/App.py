from core.FastAPIAppConfig import FastAPIAppConfig
from core.routing import AppExceptionHandlingRoute, AppRouter, BaseMiddleware
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from .Constants import APP_CONFIG_FILE
from .Loader import ModuleLoader


class App:
    api: FastAPI

    def __init__(self):
        self.app_config = FastAPIAppConfig(APP_CONFIG_FILE)
        self.config = self.app_config.load()
        self.api = FastAPI(debug=True)
        self._init_api_middlewares()
        self._init_api_routes()

        AppRouter.set_app(self.api)

    def create(self):
        AppRouter.set_app(self.api)
        self.app_config.set_restarting(True)
        return self.api

    def _init_api_middlewares(self):
        self.api.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=5)

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
