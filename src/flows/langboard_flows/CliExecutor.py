from asyncio import run as run_async
from core.bootstrap import BaseCommand, Commander
from core.Env import Env
from core.FastAPIAppConfig import FastAPIAppConfig
from langflow.services.database.utils import initialize_database
from .commands.RunCommand import RunCommandOptions
from .Constants import APP_CONFIG_FILE, HOST, PORT
from .Loader import ModuleLoader
from .ServerRunner import run as run_server


def execute():
    run_async(initialize_database())  # Initialize the database before running the app
    commander = Commander()

    modules = ModuleLoader.load("commands", "Command", BaseCommand, log=False)
    for module in modules.values():
        for command in module:
            if not command.__name__.endswith("Command") or (Env.IS_EXECUTABLE and command.is_only_in_dev()):  # type: ignore
                continue
            commander.add_commands(command(run_app=_run_app))  # type: ignore

    commander.run()
    return 0


def _run_app(options: RunCommandOptions):
    ssl_options = options.create_ssl_options() if options.ssl_keyfile else None

    if options.watch or "in-memory" in {Env.BROADCAST_TYPE, Env.CACHE_TYPE}:
        options.workers = 1

    app_config = FastAPIAppConfig(APP_CONFIG_FILE)
    app_config.create(
        host=HOST,
        port=PORT,
        uds=options.uds,
        lifespan=options.lifespan,
        ssl_options=ssl_options,
        workers=options.workers,
        watch=options.watch,
    )

    try:
        run_server()
    except KeyboardInterrupt:
        return
