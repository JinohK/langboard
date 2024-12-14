from typing import Any, Callable, Coroutine, cast
from .SocketDefaultEvent import SocketDefaultEvent
from .SocketEvent import SocketEvent, TEvent


TEvents = list[Coroutine[Any, Any, SocketEvent]]
TEventMap = dict[str, TEvents]


class SocketManager:
    """Manages the socket events.

    E.g.::

        from ...core.routing import AppRouter, SocketDefaultEvent

        @AppRouter.socket.on(SocketDefaultEvent.Open)
        def open(req: SocketRequest):
            ...
    """

    def __init__(self):
        self._events: TEventMap = {}

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

        if _event not in self._events:
            self._events[_event] = []

        def decorator(func: TEvent):
            socket_event = SocketEvent(_event, func).init()
            self._events[_event].append(socket_event)
            return func

        return decorator

    async def get_events(self, event: SocketDefaultEvent | str) -> list[SocketEvent]:
        """Gets the events for the given path and event.

        :param path: The path to get the events for.
        :param event: The event to get the events for.
        """
        _event = event.value if isinstance(event, SocketDefaultEvent) else event

        if _event not in self._events:
            return []

        events = self._events[_event]

        for i in range(len(events)):
            if isinstance(events[i], Coroutine):
                events[i] = cast(Coroutine[Any, Any, SocketEvent], await events[i])

        return cast(list[SocketEvent], events)
