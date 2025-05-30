from typing import Any, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from uvicorn import run as run_server
from .core.bootstrap import SocketApp, WebSocketOptions
from .core.logger import Logger
from .core.routing import AppExceptionHandlingRoute, AppRouter, BaseMiddleware
from .core.security import Auth
from .core.service import BotScheduleService
from .core.utils.decorators import singleton
from .Loader import load_modules
from .middlewares import AuthMiddleware, RoleMiddleware


@singleton
class App:
    api: FastAPI
    ws: SocketApp

    def __init__(
        self,
        host: str = "localhost",
        port: int = 5381,
        uds: Optional[str] = None,
        lifespan: bool = True,
        ssl_options: Any = None,
        ws_options: Optional[WebSocketOptions] = None,
        workers: int = 1,
        task_factory_maxitems: int = 100000,
        is_restarting: bool = False,
    ):
        self.api = FastAPI(debug=True)
        self.ws = SocketApp()
        self._logger = Logger.main
        self._host = host
        self._port = port
        self._uds = uds
        self._lifespan = lifespan
        self._ssl_options = ssl_options
        self._ws_options = ws_options
        self._workers = workers
        self._task_factory_maxitems = task_factory_maxitems
        self._is_restarting = is_restarting
        load_modules("bots", "Bot", log=not self._is_restarting)
        self._init_api_middlewares()
        self._init_api_routes()

        AppRouter.set_openapi_schema(self.api)
        Auth.set_openapi_schema(self.api)

    def run(self):
        self._start_server()

    def _init_api_middlewares(self):
        origins = ["*"]
        self.api.add_middleware(RoleMiddleware, routes=self.api.routes)
        self.api.add_middleware(AuthMiddleware, routes=self.api.routes)
        self.api.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=5)
        self.api.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        middleware_modules = load_modules("middlewares", "Middleware", BaseMiddleware, not self._is_restarting)
        for module in middleware_modules.values():
            for middleware in module:
                if middleware.__auto_load__:
                    self.api.add_middleware(middleware)

    def _init_api_routes(self):
        self.api.router.route_class = AppExceptionHandlingRoute
        load_modules("routes", "Api", log=not self._is_restarting)
        load_modules("routes", "Socket", log=not self._is_restarting)
        self.api.include_router(AppRouter.api)
        self.api.websocket_route("/")(self.ws.route)

    def _start_server(self):
        AppRouter.set_app(self.api)
        BotScheduleService.reload_cron()
        run_server(self.api, host=self._host, port=self._port, uds=self._uds, workers=self._workers)


if __name__ == "__main__":
    app = App()
    app.run()
