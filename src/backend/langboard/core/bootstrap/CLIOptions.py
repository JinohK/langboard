from pydantic import BaseModel, Field
from rich import print as rprint
from socketify import AppOptions
from ...constants import PROJECT_NAME
from .WebSocketOptions import WebSocketOptions


class RunCLIOptions(BaseModel):
    uds: str = Field(default=None, description="Bind to a UNIX domain socket", group="run")
    workers: int = Field(default=1, description="Number of workers to run", group="run")
    lifespan: bool = Field(default=True, description="Lifespan implementation", short="lfsp", group="run")
    ws_deflate: bool = Field(default=False, description="Enable permessage-deflate extension", short="wd", group="run")
    ws_max_size: int = Field(default=16777216, description="Max size message in bytes", short="wms", group="run")
    ws_auto_ping: bool = Field(default=True, description="Send ping automatically", short="wap", group="run")
    ws_idle_timeout: int = Field(default=20, description="Idle timeout", short="wit", group="run")
    ws_reset_idle_on_send: bool = Field(
        default=True, description="Reset idle timeout on send", short="wris", group="run"
    )
    ws_per_message_deflate: bool = Field(
        default=False, description="Per-message-deflate compression", short="wpmd", group="run"
    )
    ws_max_lifetime: int = Field(
        default=0, description="Maximum socket lifetime in seconds before forced closure", short="wml", group="run"
    )
    ws_max_backpressure: int = Field(
        default=16777216, description="Maximum backpressure in bytes", short="wmb", group="run"
    )
    ws_close_on_backpressure_limit: bool = Field(
        default=False, description="Close connections that hits maximum backpressure", short="wcobl", group="run"
    )
    ssl_keyfile: str = Field(default=None, description="SSL key file", short="ssl-key", group="run")
    ssl_certfile: str = Field(default=None, description="SSL certificate file", short="ssl-cert", group="run")
    ssl_keyfile_pass: str = Field(default=None, description="SSL keyfile password", short="ssl-pass", group="run")
    ssl_ca_certs: str = Field(default=None, description="CA certificates file", short="ssl-ca", group="run")
    ssl_ciphers: str = Field(
        default=None, description="Ciphers to use (see stdlib ssl module's) (default: TLSv1)", group="run"
    )
    task_factory_maxitems: int = Field(default=100000, description="Task factory max items", group="run")


class ModelCLIOptions(BaseModel):
    soft_delete: bool = Field(default=False, description="Use soft delete feature", short="sdel", group="model")


class CLIOptions(RunCLIOptions, ModelCLIOptions):
    command: str = Field(
        default=None,
        description="Command",
        is_command=True,
        nargs="+",
        metavar={
            "run": {
                "help": "Run the server",
                "type": bool,
            },
            "model": {
                "help": "Model to create",
                "type": str,
            },
        },
    )
    version: bool = Field(default=False, description="Show version and exit", short="v")

    def print_version(self):
        from pkg_resources import require
        from platform import python_implementation, python_version, system

        version = require(PROJECT_NAME)[0].version
        return rprint(
            f"Running {PROJECT_NAME} {version} with {python_implementation()} {python_version()} on {system()}"
        )

    def create_websocket_options(self) -> WebSocketOptions:
        return WebSocketOptions(
            compression=self.ws_deflate,
            max_payload_length=self.ws_max_size,
            idle_timeout=self.ws_idle_timeout,
            send_pings_automatically=self.ws_auto_ping,
            reset_idle_timeout_on_send=self.ws_reset_idle_on_send,
            max_lifetime=self.ws_max_lifetime,
            max_backpressure=self.ws_max_backpressure,
            close_on_backpressure_limit=self.ws_close_on_backpressure_limit,
        )

    def create_ssl_options(self) -> AppOptions:
        return AppOptions(
            key_file_name=self.ssl_keyfile,
            cert_file_name=self.ssl_certfile,
            passphrase=self.ssl_keyfile_pass,
            ca_file_name=self.ssl_ca_certs,
            ssl_ciphers=self.ssl_ciphers,
        )
