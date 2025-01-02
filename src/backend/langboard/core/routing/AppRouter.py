from enum import Enum
from typing import Any, cast, overload
from fastapi import APIRouter
from socketify import App as SocketifyApp
from socketify import OpCode
from ..service import SocketModelIdBaseResult, SocketModelIdService
from ..utils.decorators import class_instance, thread_safe_singleton
from .AppExceptionHandlingRoute import AppExceptionHandlingRoute
from .SocketManager import SocketManager
from .SocketResponse import SocketResponse
from .SocketTopic import SocketTopic


@class_instance()
@thread_safe_singleton
class AppRouter:
    """Manages the application's all routers.

    Attributes:
        `api` (`APIRouter`): The API router.
        `socket` (`SocketManager`): The socket router.
    """

    api: APIRouter
    socket: SocketManager

    def __init__(self):
        self.api = APIRouter(route_class=AppExceptionHandlingRoute)
        self.socket = SocketManager()
        self.__socketify_app: SocketifyApp = cast(SocketifyApp, None)

    def set_socketify_app(self, app: SocketifyApp):
        if not self.__socketify_app:
            self.__socketify_app = app

    @overload
    async def publish(
        self, topic: SocketTopic | str, topic_id: str, event_response: str, data: Any = None, compress: bool = False
    ): ...
    @overload
    async def publish(
        self,
        topic: SocketTopic | str,
        topic_id: str,
        event_response: SocketResponse,
        data: None = None,
        compress: bool = False,
    ): ...
    async def publish(
        self,
        topic: SocketTopic | str,
        topic_id: str,
        event_response: SocketResponse | str,
        data: Any = None,
        compress: bool = False,
    ) -> bool:
        if not self.__socketify_app:
            return False

        if isinstance(event_response, str):
            response_model = SocketResponse(event=event_response, data=data)
        elif isinstance(event_response, SocketResponse):
            response_model = event_response
        else:
            return False

        if "model_id" in (response_model.data or {}):
            response_data: dict = response_model.data
            model_id = response_data.pop("model_id")
            data = await SocketModelIdService.get_model(model_id)
            response_data.update(data)

        if isinstance(topic, Enum):
            topic = topic.value

        response_model.topic = topic
        response_model.topic_id = topic_id

        socket_topic = f"{topic}:{topic_id}"

        return self.__socketify_app.publish(
            topic=socket_topic, message=response_model.model_dump_json(), opcode=OpCode.TEXT, compress=compress
        )

    async def publish_with_socket_model(self, socket_model: SocketModelIdBaseResult):
        model = await SocketModelIdService.get_model(socket_model.model_id)
        if not model or not socket_model.publish_models or not self.__socketify_app:
            return

        if not isinstance(socket_model.publish_models, list):
            socket_model.publish_models = [socket_model.publish_models]

        for publish_model in socket_model.publish_models:
            data = {}

            if publish_model.data_keys:
                if not isinstance(publish_model.data_keys, list):
                    publish_model.data_keys = [publish_model.data_keys]

                for key in publish_model.data_keys:
                    if key in model:
                        data[key] = model[key]

            if publish_model.custom_data:
                data.update(publish_model.custom_data)

            if isinstance(publish_model.topic, SocketTopic) or isinstance(publish_model.topic, str):
                topic = publish_model.topic
            else:
                topic = publish_model.topic.value

            await self.publish(
                topic=topic,
                topic_id=publish_model.topic_id,
                event_response=publish_model.event,
                data=data,
            )
