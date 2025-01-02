from inspect import iscoroutinefunction
from json import loads as json_loads
from pathlib import Path
from time import sleep
from typing import Any, Literal, TypeVar, cast, overload
from pydantic import BaseModel
from ...Constants import QUEUE_BOT_DIR
from ..db import DbSession
from ..logger import Logger
from ..routing import AppRouter
from ..service import ServiceFactory, SocketModelIdBaseResult, SocketPublishModel
from ..utils.DateTime import now
from ..utils.String import create_short_unique_id
from .BotRunner import BotRunner
from .BotType import BotType


_TServiceFactory = TypeVar("_TServiceFactory", bound=ServiceFactory, covariant=True)


class QueueBotModel(BaseModel):
    bot_type: BotType
    bot_data: dict[str, Any]
    service_name: str
    service_method: str
    params: dict[str, Any]


class QueueBot:
    @overload
    @staticmethod
    def add(queue_type: Literal["bot"], data_model: QueueBotModel) -> None: ...
    @overload
    @staticmethod
    def add(
        queue_type: Literal["socket"], data_model: SocketPublishModel | list[SocketPublishModel], model_id: str
    ) -> None: ...
    @staticmethod
    def add(
        queue_type: str,
        data_model: QueueBotModel | SocketPublishModel | list[SocketPublishModel],
        model_id: str | None = None,
    ) -> None:
        QUEUE_BOT_DIR.mkdir(parents=True, exist_ok=True)
        file_name = f"{int(now().timestamp())}-{create_short_unique_id(10)}.queue"
        file_path = QUEUE_BOT_DIR / file_name
        with file_path.open("wb") as f:
            f.write(f"{queue_type},{model_id or ""}\n".encode(encoding="utf-8"))
            if isinstance(data_model, list):
                model_list = [model.model_dump() for model in data_model]
                f.write(f"{model_list}\n".encode(encoding="utf-8"))
            else:
                f.write(data_model.model_dump_json().encode(encoding="utf-8"))
            f.close()

    def __init__(self, service_factory_type: type[_TServiceFactory]):
        QUEUE_BOT_DIR.mkdir(parents=True, exist_ok=True)
        self.__logger = Logger.use("QueueBot")
        self.__service_factory_type = service_factory_type

    async def loop(self):
        self.__logger.info("Queue bot loop started.")
        try:
            while True:
                await self.__loop()
                sleep(1)
        except Exception:
            return

    async def __loop(self):
        file_list = self.__get_file_list()
        if not file_list:
            return
        db = DbSession()
        service_factory = self.__service_factory_type(db)
        for file in file_list:
            await self.__execute(service_factory, file)
            file.unlink()
            self.__logger.info("Bot executed: %s", file.name)
        service_factory.close()
        await db.close()

    def __get_file_list(self) -> list[Path]:
        file_list = [file for file in QUEUE_BOT_DIR.glob("*.queue")]
        return file_list

    async def __execute(self, service_factory: ServiceFactory, file: Path):
        with file.open("rb") as f:
            queue_type, model_id = f.readline().decode(encoding="utf-8").strip().split(",")
            json = f.readline().decode(encoding="utf-8")
            f.close()

        self.__logger.info("Executing bot: %s", file.name)

        if ["bot", "socket"].count(queue_type) != 1:
            self.__logger.error("Invalid queue type: %s", queue_type)
            return

        try:
            data = json_loads(json)
            if isinstance(data, list):
                data_model = [self.__create_data_model(queue_type, **model) for model in data]
            else:
                data_model = self.__create_data_model(queue_type, **data)
            if not data_model:
                raise Exception
        except Exception:
            self.__logger.error("Failed to load json from file: %s", file.name)
            return

        if queue_type == "bot":
            await self.__execute_bot(cast(QueueBotModel, data_model), service_factory, file)
        elif queue_type == "socket":
            await self.__run_socket(SocketModelIdBaseResult(model_id, None, cast(SocketPublishModel, data_model)))

    async def __execute_bot(self, data_model: QueueBotModel, service_factory: ServiceFactory, file: Path):
        if not await BotRunner.is_available(data_model.bot_type):
            return

        output = await self.__run_bot(data_model)
        if not output:
            return

        data_model.params["user_or_bot"] = data_model.bot_type
        for param, param_value in data_model.params.items():
            data_model.params[param] = self.__replace_output(param_value, output)

        if not hasattr(service_factory, data_model.service_name):
            self.__logger.error("Invalid service: %s", data_model.service_name)
            return

        await self.__run_service(service_factory, file, data_model)

    async def __run_bot(self, data_model: QueueBotModel) -> str | None:
        result = await BotRunner.run(data_model.bot_type, data_model.bot_data)
        if not result:
            return None

        if isinstance(result, str):
            return result

        chunks = []
        async for chunk in result:
            if not chunk:
                continue
            chunks.append(chunk)
        return "".join(chunks)

    async def __run_service(self, service_factory: ServiceFactory, file: Path, data_model: QueueBotModel) -> None:
        service_instance = getattr(service_factory, data_model.service_name)

        if not hasattr(service_instance, data_model.service_method):
            self.__logger.error("Invalid service method: %s.%s", data_model.service_name, data_model.service_method)
            return

        service_executor = getattr(service_instance, data_model.service_method)

        try:
            result = None
            if iscoroutinefunction(service_executor):
                result = await service_executor(**data_model.params)
            elif callable(service_executor):
                result = service_executor(**data_model.params)

            await self.__run_socket(result=result)
        except Exception as e:
            self.__logger.error(e)
            self.__logger.error("Failed to execute bot: %s", file.name)
            return

    async def __run_socket(self, result: Any) -> None:
        if not isinstance(result, SocketModelIdBaseResult):
            return

        try:
            await AppRouter.publish_with_socket_model(result)
        except Exception:
            pass

    def __replace_output(self, param_value: Any, output: str) -> Any:
        if isinstance(param_value, str):
            return param_value.format(output=output)
        elif isinstance(param_value, dict):
            for key in param_value:
                param_value[key] = self.__replace_output(param_value[key], output)
            return param_value
        elif isinstance(param_value, list):
            for i, value in enumerate(param_value):
                param_value[i] = self.__replace_output(value, output)
            return param_value
        else:
            return param_value

    def __create_data_model(self, queue_type: str, **kwargs):
        if queue_type == "bot":
            return QueueBotModel(**kwargs)
        elif queue_type == "socket":
            return SocketPublishModel(**kwargs)
