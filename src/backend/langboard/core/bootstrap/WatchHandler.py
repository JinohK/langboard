from os.path import getmtime
from pathlib import Path
from time import sleep
from typing import Callable, cast
from watchdog.events import (
    EVENT_TYPE_CREATED,
    EVENT_TYPE_DELETED,
    EVENT_TYPE_MODIFIED,
    EVENT_TYPE_MOVED,
    FileSystemEvent,
    FileSystemEventHandler,
)
from watchdog.observers import Observer


class WatchHandler(FileSystemEventHandler):
    def _init__(self) -> None:
        super().__init__()

    def init(self, callback: Callable) -> "WatchHandler":
        self.__callback = callback
        self.__last_event = None
        self.__last_time = None
        self.__is_restarting = False
        return self

    def on_any_event(self, event: FileSystemEvent) -> None:
        if (
            [EVENT_TYPE_MOVED, EVENT_TYPE_DELETED, EVENT_TYPE_MODIFIED, EVENT_TYPE_CREATED].count(event.event_type) == 0
            or event.is_directory
            or not isinstance(event.src_path, str)
        ):
            return

        if not event.src_path.endswith(".py"):
            return

        last_modified = int(getmtime(event.src_path))
        if (self.__last_event == event and self.__last_time == last_modified) or self.__is_restarting:
            return

        self.__last_event = event
        self.__last_time = last_modified
        self.__is_restarting = True
        self.__callback(event)
        self.__is_restarting = False


def start_watch(path: str | Path, callback: Callable, on_close: Callable) -> None:
    handler = WatchHandler().init(callback)
    observer = Observer()
    observer.schedule(handler, cast(str, path), recursive=True)
    observer.start()
    try:
        while True:
            sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        on_close()
        observer.stop()
        observer.join()
