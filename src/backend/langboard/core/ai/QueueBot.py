from inspect import iscoroutinefunction
from json import loads as json_loads
from pathlib import Path
from time import sleep
from typing import Any, TypeVar
from pydantic import BaseModel
from ...Constants import QUEUE_BOT_DIR
from ..db import DbSession
from ..logger import Logger
from ..routing import AppRouter
from ..service import ServiceFactory, SocketModelIdBaseResult
from ..utils.DateTime import now
from ..utils.String import create_short_unique_id
from .BotRunner import BotRunner
from .BotType import BotType


_TServiceFactory = TypeVar("_TServiceFactory", bound=ServiceFactory, covariant=True)


class QueueBotSocketModel(BaseModel):
    topic: str
    topic_id: str
    event: str
    model_id: str

    def __init__(self, topic: str, topic_id: str, event: str, model_id: str):
        self.topic = topic
        self.topic_id = topic_id
        self.event = event
        self.model_id = model_id


class QueueBotModel(BaseModel):
    bot_type: BotType
    bot_data: dict[str, Any]
    service_name: str
    service_method: str
    params: dict[str, Any]
    socket_model: QueueBotSocketModel | None = None


class QueueBot:
    @staticmethod
    def add(queue_bot_model: QueueBotModel) -> None:
        QUEUE_BOT_DIR.mkdir(parents=True, exist_ok=True)
        file_name = f"{int(now().timestamp())}-{create_short_unique_id(10)}.queue"
        file_path = QUEUE_BOT_DIR / file_name
        with file_path.open("wb") as f:
            f.write(queue_bot_model.model_dump_json().encode(encoding="utf-8"))
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
            json = f.readline().decode(encoding="utf-8")
            f.close()

        self.__logger.info("Executing bot: %s", file.name)

        try:
            data = json_loads(json)
            queue_bot_model = QueueBotModel(**data)
        except Exception:
            self.__logger.error("Failed to load json from file: %s", file.name)
            return

        if not await BotRunner.is_available(queue_bot_model.bot_type):
            return

        output = await self.__run_bot(queue_bot_model)
        if not output:
            return

        queue_bot_model.params["user_or_bot"] = queue_bot_model.bot_type
        for param, param_value in queue_bot_model.params.items():
            queue_bot_model.params[param] = self.__replace_output(param_value, output)

        if not hasattr(service_factory, queue_bot_model.service_name):
            self.__logger.error("Invalid service: %s", queue_bot_model.service_name)
            return

        await self.__run_service(service_factory, file, queue_bot_model)

    async def __run_bot(self, queue_bot_model: QueueBotModel) -> str | None:
        result = await BotRunner.run(queue_bot_model.bot_type, queue_bot_model.bot_data)
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

    async def __run_service(self, service_factory: ServiceFactory, file: Path, queue_bot_model: QueueBotModel) -> None:
        service_instance = getattr(service_factory, queue_bot_model.service_name)

        if not hasattr(service_instance, queue_bot_model.service_method):
            self.__logger.error(
                "Invalid service method: %s.%s", queue_bot_model.service_name, queue_bot_model.service_method
            )
            return

        service_executor = getattr(service_instance, queue_bot_model.service_method)

        try:
            result = None
            if iscoroutinefunction(service_executor):
                result = await service_executor(**queue_bot_model.params)
            elif callable(service_executor):
                result = service_executor(**queue_bot_model.params)

            await self.__run_socket(queue_bot_model=queue_bot_model, result=result)
        except Exception as e:
            self.__logger.error(e)
            self.__logger.error("Failed to execute bot: %s", file.name)
            return

    async def __run_socket(self, queue_bot_model: QueueBotModel, result: Any) -> None:
        if not isinstance(result, SocketModelIdBaseResult) or not queue_bot_model.socket_model:
            return

        try:
            await AppRouter.publish_with_socket_model(result)
        except Exception:
            pass

    def __replace_output(self, param_value: Any, output: str) -> Any:
        if isinstance(param_value, str):
            return param_value.format(output)
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
