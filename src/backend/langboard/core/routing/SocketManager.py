from asyncio import run
from enum import Enum
from inspect import iscoroutinefunction
from threading import Thread
from typing import Any, Callable, Coroutine, cast
from ..db import User
from .SocketDefaultEvent import SocketDefaultEvent
from .SocketEvent import SocketEvent, TEvent
from .SocketResponse import SocketResponse
from .SocketResponseCode import SocketResponseCode
from .SocketTopic import GLOBAL_TOPIC_ID, SocketTopic
from .WebSocket import WebSocket


TEvents = list[Coroutine[Any, Any, SocketEvent]]
TEventMap = dict[str, TEvents]

TSubscriptionValidator = Callable[[User, str], Coroutine[Any, Any, bool]]


class SocketManager:
    """Manages the socket events.

    E.g.::

        from ...core.routing import AppRouter, SocketDefaultEvent

        @AppRouter.socket.on(SocketDefaultEvent.Open)
        def open(req: SocketRequest):
            ...
    """

    def __init__(self):
        self.__events: TEventMap = {}
        self.__validators: dict[str, TSubscriptionValidator] = {}
        self.__subscribers: dict[tuple[str, str], set[WebSocket]] = {(SocketTopic.Global.value, GLOBAL_TOPIC_ID): set()}

    def on(self, event: SocketDefaultEvent | str) -> Callable[[TEvent], TEvent]:
        """Registers a socket event for the current path.

        E.g.::

                from ...core.routing import AppRouter, SocketDefaultEvent

                @AppRouter.socket.on(SocketDefaultEvent.Open)
                def open(req: SocketRequest):
                    ...

        :param event: The event to register.
        """
        _event = event.value if isinstance(event, SocketDefaultEvent) else event

        if _event not in self.__events:
            self.__events[_event] = []

        def decorator(func: TEvent):
            socket_event = SocketEvent(_event, func).init()
            self.__events[_event].append(socket_event)
            return func

        return decorator

    def subscription_validator(self, topic: SocketTopic | str) -> Callable:
        topic = topic.value if isinstance(topic, SocketTopic) else topic
        if topic in self.__validators:
            raise ValueError(f"Subscription validator for topic {topic} already exists.")

        def decorator(func: TSubscriptionValidator):
            self.__validators[topic] = func
            return func

        return decorator

    async def get_events(self, event: SocketDefaultEvent | str) -> list[SocketEvent]:
        """Gets the events for the given path and event.

        :param path: The path to get the events for.
        :param event: The event to get the events for.
        """
        _event = event.value if isinstance(event, SocketDefaultEvent) else event

        if _event not in self.__events:
            return []

        events = self.__events[_event]

        for i in range(len(events)):
            if isinstance(events[i], Coroutine):
                events[i] = cast(Coroutine[Any, Any, SocketEvent], await events[i])

        return cast(list[SocketEvent], events)

    async def publish(self, topic: str | SocketTopic, topic_id: str, event: str, data: Any = None) -> bool:
        if isinstance(topic, Enum):
            topic = topic.value

        if (topic, topic_id) not in self.__subscribers:
            return False

        response = SocketResponse(
            topic=topic,
            topic_id=topic_id,
            event=event,
            data=data,
        )

        for ws in self.__subscribers[(topic, topic_id)]:
            await ws.send(response)

        return True

    async def subscribe(self, ws: WebSocket, topic: str | SocketTopic, topic_ids: list[str]):
        if not topic_ids:
            return

        if isinstance(topic, Enum):
            topic = topic.value

        for topic_id in topic_ids:
            if (topic, topic_id) not in self.__subscribers:
                self.__subscribers[(topic, topic_id)] = set()

            self.__subscribers[(topic, topic_id)].add(ws)

        await ws.send(event_response=SocketResponse(event="subscribed", topic=topic, topic_id=topic_ids))

    async def unsubscribe(self, ws: WebSocket, topic: str | SocketTopic, topic_ids: list[str]):
        if not topic_ids:
            return

        if isinstance(topic, Enum):
            topic = topic.value

        for topic_id in topic_ids:
            if (topic, topic_id) not in self.__subscribers:
                return

            if ws in self.__subscribers[(topic, topic_id)]:
                self.__subscribers[(topic, topic_id)].remove(ws)

        await ws.send(event_response=SocketResponse(event="unsubscribed", topic=topic, topic_id=topic_ids))

    async def unsubscribe_all(self, ws: WebSocket):
        for topic, topic_id in self.__subscribers:
            if ws in self.__subscribers[(topic, topic_id)]:
                self.__subscribers[(topic, topic_id)].remove(ws)

    async def toggle_subscription(self, ws: WebSocket, event: str, data: dict) -> bool:
        if event != "subscribe" and event != "unsubscribe":
            return False

        is_subscribe = event == "subscribe"
        topic = data.get("topic", None)
        topic_id = data.get("topic_id", None)
        if not topic or not topic_id:
            await ws.send_error(SocketResponseCode.WS_4001_INVALID_DATA, "Invalid data", should_close=False)
            return True

        topic_ids = [topic_id] if not isinstance(topic_id, list) else topic_id

        if is_subscribe:
            validator = self.get_subscription_validator(topic)
            if validator:
                validated_topic_ids = []
                for topic_id in topic_ids:
                    if await validator(ws.get_user(), topic_id):
                        validated_topic_ids.append(topic_id)
            else:
                validated_topic_ids = topic_ids

            result = await self.subscribe(ws, topic, validated_topic_ids)
            if isinstance(result, SocketResponseCode):
                await ws.send_error(result, "Forbidden", should_close=False)
                return True
        else:
            await self.unsubscribe(ws, topic, topic_ids)

        return True

    def get_subscription_validator(self, topic: SocketTopic | str) -> TSubscriptionValidator | None:
        topic = topic.value if isinstance(topic, SocketTopic) else topic
        if topic not in self.__validators:
            return None
        return self.__validators[topic]

    def run_in_thread(self, func: Callable, *args, **kwargs):
        def start(args: tuple, kwargs: dict):
            if iscoroutinefunction(func):
                run(func(*args, **kwargs))
            else:
                func(*args, **kwargs)

        Thread(target=start, args=(args, kwargs)).start()
