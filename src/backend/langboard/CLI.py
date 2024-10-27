from logging import INFO
from multiprocessing import Process, cpu_count
from os import sep
from typing import cast
from sqlalchemy.orm import close_all_sessions
from .App import App
from .Constants import HOST, PORT
from .core.bootstrap import Commander
from .core.bootstrap.BaseCommand import BaseCommand
from .core.bootstrap.commands.RunCommand import RunCommandOptions
from .core.logger import Logger
from .Loader import load_modules


def _start_app(options: RunCommandOptions, is_restarting: bool = False) -> None:
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


def _run_app_wrapper(options: RunCommandOptions, is_restarting: bool = False) -> Process:
    if is_restarting:
        Logger.main._log(level=INFO, msg="File changed. Restarting the server..", args=())
    process = Process(target=_start_app, args=(options, is_restarting))
    process.start()
    return process


def _close_processes(processes: list[Process]):
    close_all_sessions()
    for process in processes:
        process.terminate()
        process.kill()
        process.join()
        process.close()
    processes.clear()


def _run_workers(options: RunCommandOptions, is_restarting: bool = False):
    workers = options.workers
    options.workers = 1
    processes: list[Process] = []
    try:
        for _ in range(min(workers, cpu_count())):
            process = _run_app_wrapper(options, is_restarting)
            processes.append(process)

        options.workers = workers

        return processes
    except Exception:
        _close_processes(processes)
        raise


def _watch(options: RunCommandOptions):
    from os.path import dirname
    from pathlib import Path
    from .core.bootstrap.WatchHandler import start_watch

    processes = _run_workers(options)

    def on_close():
        _close_processes(processes)

    def callback(_):
        _close_processes(processes)
        processes.extend(_run_workers(options, is_restarting=True))

    start_watch(cast(str, Path(dirname(__file__))), callback, on_close)


def _run_app(options: RunCommandOptions):
    if options.workers < 1:
        options.workers = 1

    if options.watch:
        _watch(options)
        return

    processes = _run_workers(options)

    try:
        for process in processes:
            process.join()
    except Exception:
        _close_processes(processes)
        raise


def execute():
    commander = Commander()

    modules = load_modules(f"core{sep}bootstrap{sep}commands", "Command", BaseCommand, log=False)
    for module in modules.values():
        for command in module:
            if command.__name__.endswith("Command"):
                commander.add_commands(command(run_app=_run_app))  # type: ignore

    commander.run()
    return 0
