from logging import INFO
from multiprocessing import Process
from os import sep
from .App import App
from .Constants import HOST, PORT
from .core.bootstrap import Commander
from .core.bootstrap.BaseCommand import BaseCommand
from .core.bootstrap.commands.RunCommand import RunCommandOptions
from .core.logger import Logger
from .Loader import load_modules


def __run_app_wrapper(options: RunCommandOptions, is_restarting: bool = False) -> None:
    ssl_options = options.create_ssl_options() if options.ssl_keyfile else None

    websocket_options = options.create_websocket_options()

    app = App(
        host=HOST,
        port=PORT,
        uds=options.uds,
        lifespan=options.lifespan,
        ssl_options=ssl_options,
        ws_options=websocket_options,
        workers=options.workers,
        task_factory_maxitems=options.task_factory_maxitems,
        is_restarting=is_restarting,
    )

    app.run()


def __run_app(options: RunCommandOptions):
    if options.workers < 1:
        options.workers = 1

    if not options.watch:
        __run_app_wrapper(options)
        return

    def process_app(old_process: Process | None = None, is_restarting: bool = False) -> Process:
        if old_process:
            old_process.kill()
            old_process.join()
        if is_restarting:
            Logger.main._log(level=INFO, msg="File changed. Restarting the server..", args=())
        process = Process(target=__run_app_wrapper, args=(options, is_restarting))
        process.start()
        return process

    app_process = process_app()

    from os.path import dirname, getmtime
    from pathlib import Path
    from time import sleep
    from typing import cast
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
        def __init__(self) -> None:
            super().__init__()
            self.__last_event = None
            self.__last_time = None
            self.__is_restarting = False

        def on_any_event(self, event: FileSystemEvent) -> None:
            if (
                [EVENT_TYPE_MOVED, EVENT_TYPE_DELETED, EVENT_TYPE_MODIFIED, EVENT_TYPE_CREATED].count(event.event_type)
                == 0
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
            process_app(app_process, True)
            self.__is_restarting = False

    event_handler = WatchHandler()
    observer = Observer()
    observer.schedule(event_handler, cast(str, Path(dirname(__file__))), recursive=True)
    observer.start()
    try:
        while True:
            sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        observer.stop()
        observer.join()


def execute():
    commander = Commander()

    modules = load_modules(f"core{sep}bootstrap{sep}commands", "Command", BaseCommand, log=False)
    for module in modules.values():
        for command in module:
            if command.__name__.endswith("Command"):
                commander.add_commands(command(run_app=__run_app))  # type: ignore

    commander.run()
    return 0
