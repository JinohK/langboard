from logging import INFO
from multiprocessing import Process, Queue, cpu_count
from os import getpid, kill, sep
from os.path import dirname
from pathlib import Path
from signal import SIGINT
from threading import Thread
from typing import cast
from sqlalchemy.orm import close_all_sessions
from .App import App
from .Constants import HOST, PORT
from .core.bootstrap import Commander
from .core.bootstrap.BaseCommand import BaseCommand
from .core.bootstrap.commands.RunCommand import RunCommandOptions
from .core.broadcast import DispatcherQueue
from .core.broker import Broker
from .core.logger import Logger
from .Loader import load_modules


def execute():
    commander = Commander()

    modules = load_modules(f"core{sep}bootstrap{sep}commands", "Command", BaseCommand, log=False)
    for module in modules.values():
        for command in module:
            if command.__name__.endswith("Command"):
                commander.add_commands(command(run_app=_run_app))  # type: ignore

    commander.run()
    return 0


def _run_app(options: RunCommandOptions):
    if options.workers < 1:
        options.workers = 1

    _watch(options)


def _watch(options: RunCommandOptions):
    from .core.bootstrap.WatchHandler import start_watch

    processes = _run_workers(options)

    def on_close():
        _close_processes(processes, False)

    def callback(_):
        if options.watch:
            _close_processes(processes, True)
            processes.extend(_run_workers(options, is_restarting=True))

    start_watch(cast(str, Path(dirname(__file__))), callback, on_close)


def _run_workers(options: RunCommandOptions, is_restarting: bool = False):
    worker_queues = [Queue() for _ in range(min(options.workers, cpu_count()))]
    DispatcherQueue.start(worker_queues)

    workers = options.workers
    options.workers = 1
    processes: list[Process] = []
    try:
        for i in range(min(workers, cpu_count())):
            process = _run_app_wrapper(i, options, worker_queues, is_restarting)
            processes.append(process)

        broker_process = _run_broker(is_restarting)
        if broker_process:
            processes.append(broker_process)

        options.workers = workers

        return processes
    except Exception:
        _close_processes(processes, is_restarting)
        raise


def _close_processes(processes: list[Process], is_restarting: bool = False):
    DispatcherQueue.close()
    if not is_restarting:
        Logger.main.info("Terminating the server..")

    close_all_sessions()
    for process in processes:
        process.terminate()
        process.kill()
        process.join()
        process.close()
    processes.clear()


def _run_broker(is_restarting: bool = False) -> Process | None:
    if Broker.is_in_memory():
        return None

    process = Process(target=_start_broker, args=(is_restarting,))
    process.start()
    return process


def _run_app_wrapper(
    index: int, options: RunCommandOptions, worker_queues: list[Queue], is_restarting: bool = False
) -> Process:
    if is_restarting:
        Logger.main._log(level=INFO, msg="File changed. Restarting the server..", args=())
    process = Process(target=_start_app, args=(index, options, worker_queues, is_restarting))
    process.start()
    return process


def _start_app(index: int, options: RunCommandOptions, worker_queues: list[Queue], is_restarting: bool = False) -> None:
    from .core.broadcast import DispatcherQueue, WorkerQueue

    DispatcherQueue.start(worker_queues)
    WorkerQueue.queue = worker_queues[index]

    pid = getpid()
    ssl_options = options.create_ssl_options() if options.ssl_keyfile else None

    websocket_options = options.create_websocket_options()

    broker_thread = None
    if Broker.is_in_memory():
        broker_thread = Thread(target=_start_broker, args=(is_restarting,))
        broker_thread.start()

    queue_thread = Thread(
        target=_start_worker_queue,
        args=(is_restarting,),
    )
    queue_thread.start()

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

    kill(pid, SIGINT)


def _start_broker(is_restarting: bool = False) -> None:
    from .core.broker import Broker

    load_modules("tasks", "Task", log=not is_restarting)

    Broker.start()


def _start_worker_queue(is_restarting: bool = False) -> None:
    from .core.broadcast import WorkerQueue

    load_modules("consumers", "Consumer", log=not is_restarting)

    WorkerQueue.start()
