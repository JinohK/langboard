from ssl import CERT_NONE
from uvicorn.config import SSL_PROTOCOL_VERSION
from .AppConfig import AppConfig
from .Constants import BASE_DIR, PROJECT_NAME
from .core.bootstrap.uvicorn import create_config
from .core.bootstrap.uvicorn import run as run_server
from .core.logger import Logger


def run():
    config = AppConfig.load()

    try:
        uvicorn_config = create_config(
            f"{PROJECT_NAME}.AppInstance:app",
            host=config.host,
            port=config.port,
            uds=config.uds,
            lifespan=config.lifespan,
            ws_max_queue=config.ws_options.max_queue if config.ws_options else 32,
            ws_max_size=config.ws_options.max_size if config.ws_options else 16777216,
            ws_ping_interval=config.ws_options.ping_interval if config.ws_options else 20.0,
            ws_ping_timeout=config.ws_options.ping_timeout if config.ws_options else 20.0,
            ws_per_message_deflate=config.ws_options.per_message_deflate if config.ws_options else True,
            ssl_keyfile=config.ssl_options.get("keyfile"),
            ssl_certfile=config.ssl_options.get("certfile"),
            ssl_keyfile_password=config.ssl_options.get("keyfile_password"),
            ssl_version=config.ssl_options.get("version", SSL_PROTOCOL_VERSION),
            ssl_cert_reqs=config.ssl_options.get("cert_reqs", CERT_NONE),
            ssl_ca_certs=config.ssl_options.get("ca_certs"),
            workers=config.workers,
            reload=config.watch,
            reload_dirs=str(BASE_DIR) if config.watch else None,
            log_config=Logger.get_config(),
            app_dir=str(BASE_DIR),
        )

        run_server(uvicorn_config)
    except Exception:
        return
