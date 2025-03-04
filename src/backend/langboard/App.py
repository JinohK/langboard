from logging import INFO
from typing import Optional, cast
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from socketify import ASGI, AppListenOptions, AppOptions, asgi
from .core.bootstrap import SocketApp, WebSocketOptions
from .core.logger import Logger
from .core.routing import AppExceptionHandlingRoute, AppRouter, BaseMiddleware
from .core.security import Auth
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
        ssl_options: Optional[AppOptions] = None,
        ws_options: Optional[WebSocketOptions] = None,
        workers: int = 1,
        task_factory_maxitems: int = 100000,
        is_restarting: bool = False,
    ):
        asgi.task_wrapper = self._intercept_task_wrapper

        self.api = FastAPI(debug=True)
        self.ws = SocketApp()
        self._logger = Logger.main
        self._server: Optional[ASGI] = None
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

    def _start_server(self):
        if self._uds:
            listen_options = AppListenOptions(domain=self._uds)
        else:
            listen_options = AppListenOptions(port=self._port, host=self._host)

        def listen_log(config):
            if self._is_restarting:
                msg = "Server restarted successfully."
            elif self._uds:
                msg = f"Listening on {config.domain} {'https' if self._ssl_options else 'http'}://localhost"
            else:
                msg = f"Listening on {'https' if self._ssl_options else 'http'}://{config.host if config.host and len(config.host) > 1 else 'localhost' }:{config.port}"
            self._logger._log(level=INFO, msg=msg, args=())

        self._server = ASGI(
            self.api,
            options=self._ssl_options,
            websocket=cast(bool, self.ws),
            websocket_options=self._ws_options.model_dump() if self._ws_options else None,
            task_factory_max_items=self._task_factory_maxitems,
            lifespan=self._lifespan,
        ).listen(listen_options, listen_log)

        self._server.run(workers=self._workers)

    async def _intercept_task_wrapper(self, task):
        try:
            return await task
        except Exception as error:
            try:
                # just log in console the error to call attention
                self._logger.exception("Uncaught Exception: %s" % str(error))
            finally:
                return None


if __name__ == "__main__":
    app = App()
    app.run()
