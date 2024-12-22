from typing import Any, Callable, Coroutine, cast
from ..db import User
from .SocketDefaultEvent import SocketDefaultEvent
from .SocketEvent import SocketEvent, TEvent
from .SocketTopic import SocketTopic


TEvents = list[Coroutine[Any, Any, SocketEvent]]
TEventMap = dict[str, TEvents]

TSubscriptionValidator = Callable[[str, User], Coroutine[Any, Any, bool]]


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

    def get_subscription_validator(self, topic: SocketTopic | str) -> TSubscriptionValidator | None:
        topic = topic.value if isinstance(topic, SocketTopic) else topic
        if topic not in self.__validators:
            return None
        return self.__validators[topic]
