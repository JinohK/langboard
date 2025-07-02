from pathlib import Path
from typing import Any, Optional
from pydantic import BaseModel
from uvicorn.config import LifespanType


class FastAPIAppConfigModel(BaseModel):
    host: str
    port: int
    uds: Optional[str] = None
    lifespan: LifespanType
    ssl_options: dict[str, Any] = {}
    workers: int
    is_restarting: bool = False
    watch: bool = False


class FastAPIAppConfig:
    def __init__(self, config_file: str | Path):
        self.__config_file = Path(config_file)

    def create(
        self,
        host: str = "localhost",
        port: int = 5381,
        uds: Optional[str] = None,
        lifespan: LifespanType = "auto",
        ssl_options: Any = None,
        workers: int = 1,
        watch: bool = False,
    ):
        self.__config_file.parent.mkdir(parents=True, exist_ok=True)
        self.__config_file.touch(exist_ok=True)

        config = FastAPIAppConfigModel.model_validate(
            {
                "host": host,
                "port": port,
                "uds": uds,
                "lifespan": lifespan,
                "ssl_options": ssl_options or {},
                "workers": workers,
                "is_restarting": False,
                "watch": watch,
            }
        )

        with open(self.__config_file, "w") as f:
            f.write(config.model_dump_json())

    def load(self) -> FastAPIAppConfigModel:
        if not self.__config_file.exists():
            raise FileNotFoundError(f"Configuration file {self.__config_file} does not exist.")

        with open(self.__config_file, "r") as f:
            config = f.read()
        return FastAPIAppConfigModel.model_validate_json(config)

    def set_restarting(self, is_restarting: bool):
        config = self.load()
        config.is_restarting = is_restarting

        with open(self.__config_file, "w") as f:
            f.write(config.model_dump_json())
