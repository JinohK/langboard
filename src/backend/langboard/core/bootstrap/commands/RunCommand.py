from typing import Any, cast
from pydantic import Field
from ....Constants import IS_EXECUTABLE
from ..BaseCommand import BaseCommand, BaseCommandOptions
from ..WebSocketOptions import WebSocketOptions


class RunCommandOptions(BaseCommandOptions):
    uds: str = cast(str, Field(default=None, description="Bind to a UNIX domain socket"))
    workers: int = Field(default=1, description="Number of workers to run")
    lifespan: bool = Field(default=True, description="Lifespan implementation", short="lfsp")  # type: ignore
    ws_deflate: bool = Field(default=False, description="Enable permessage-deflate extension", short="wd")  # type: ignore
    ws_max_size: int = Field(default=16777216, description="Max size message in bytes", short="wms")  # type: ignore
    ws_auto_ping: bool = Field(default=True, description="Send ping automatically", short="wap")  # type: ignore
    ws_idle_timeout: int = Field(default=60, description="Idle timeout", short="wit")  # type: ignore
    ws_reset_idle_on_send: bool = Field(
        default=True,
        description="Reset idle timeout on send",
        short="wris",  # type: ignore
    )
    ws_per_message_deflate: bool = Field(
        default=False,
        description="Per-message-deflate compression",
        short="wpmd",  # type: ignore
    )
    ws_max_lifetime: int = Field(
        default=0,
        description="Maximum socket lifetime in seconds before forced closure",
        short="wml",  # type: ignore
    )
    ws_max_backpressure: int = Field(
        default=16777216,
        description="Maximum backpressure in bytes",
        short="wmb",  # type: ignore
    )
    ws_close_on_backpressure_limit: bool = Field(
        default=False,
        description="Close connections that hits maximum backpressure",
        short="wcobl",  # type: ignore
    )
    ssl_keyfile: str = Field(default=None, description="SSL key file", short="ssl-key")  # type: ignore
    ssl_certfile: str = Field(default=None, description="SSL certificate file", short="ssl-cert")  # type: ignore
    ssl_keyfile_pass: str = Field(default=None, description="SSL keyfile password", short="ssl-pass")  # type: ignore
    ssl_ca_certs: str = Field(default=None, description="CA certificates file", short="ssl-ca")  # type: ignore
    ssl_ciphers: str = cast(
        str,
        Field(
            default=None,
            description="Ciphers to use (see stdlib ssl module's) (default: TLSv1)",
        ),
    )
    task_factory_maxitems: int = Field(default=100000, description="Task factory max items")
    if not IS_EXECUTABLE:
        watch: bool = Field(default=False, description="Watch for changes", short="w")  # type: ignore

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

    def create_ssl_options(self) -> Any:
        return {
            "ssl_keyfile": self.ssl_keyfile,
            "ssl_certfile": self.ssl_certfile,
            "ssl_keyfile_pass": self.ssl_keyfile_pass,
            "ssl_ca_certs": self.ssl_ca_certs,
            "ssl_ciphers": self.ssl_ciphers,
        }


class RunCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return False

    @property
    def option_class(self) -> type[RunCommandOptions]:
        return RunCommandOptions

    @property
    def command(self) -> str:
        return "run"

    @property
    def positional_name(self) -> str:
        return ""

    @property
    def description(self) -> str:
        return "Run the server"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return bool

    def execute(self, options: RunCommandOptions) -> None:
        self._kwargs["run_app"](options)
