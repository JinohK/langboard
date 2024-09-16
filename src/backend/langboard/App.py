from logging import INFO
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from socketify import ASGI, AppListenOptions, AppOptions
from .core.bootstrap import SocketApp, WebSocketOptions
from .core.logger import Logger
from .core.routing import AppExceptionHandlingRoute, AppRouter
from .core.utils.decorators import singleton
from .Loader import load_modules


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
    ):
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
        self._init_api_middlewares()
        self._init_api_routes()

    def run(self):
        self._start_server()

    def _init_api_middlewares(self):
        self.api.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        self.api.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=5)
        middleware_modules = load_modules("middlewares", "Middleware")
        for module in middleware_modules.values():
            for middleware in module:
                self.api.add_middleware(middleware)

    def _init_api_routes(self):
        self.api.router.route_class = AppExceptionHandlingRoute
        load_modules("routes", "Api")
        load_modules("routes", "Socket")
        self.api.include_router(AppRouter.api)

    def _start_server(self):
        if self._uds:
            listen_options = AppListenOptions(domain=self._uds)
        else:
            listen_options = AppListenOptions(port=self._port, host=self._host)

        def listen_log(config):
            if self._uds:
                msg = f"Listening on {config.domain} {'https' if self._ssl_options else 'http'}://localhost"
            else:
                msg = f"Listening on {'https' if self._ssl_options else 'http'}://{config.host if config.host and len(config.host) > 1 else 'localhost' }:{config.port}"
            self._logger._log(level=INFO, msg=msg, args=())

        self._server = ASGI(
            self.api,
            options=self._ssl_options,
            websocket=self.ws,
            websocket_options=self._ws_options.model_dump(),
            task_factory_max_items=self._task_factory_maxitems,
            lifespan=self._lifespan,
        ).listen(listen_options, listen_log)

        self._server.run(workers=self._workers)


if __name__ == "__main__":
    app = App()
    app.run()
