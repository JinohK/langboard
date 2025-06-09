from os import sep
from .AppConfig import AppConfig
from .Constants import BROADCAST_TYPE, CACHE_TYPE, HOST, IS_EXECUTABLE, PORT
from .core.bootstrap import Commander
from .core.bootstrap.BaseCommand import BaseCommand
from .core.bootstrap.commands.DbUpgradeCommand import DbUpgradeCommand, DbUpgradeCommandOptions
from .core.bootstrap.commands.RunCommand import RunCommandOptions
from .Loader import load_modules
from .ServerRunner import run as run_server


def execute():
    commander = Commander()

    modules = load_modules(f"core{sep}bootstrap{sep}commands", "Command", BaseCommand, log=False)
    for module in modules.values():
        for command in module:
            if not command.__name__.endswith("Command") or (IS_EXECUTABLE and command.is_only_in_dev()):  # type: ignore
                continue
            commander.add_commands(command(run_app=_run_app))  # type: ignore

    commander.run()
    return 0


def _run_app(options: RunCommandOptions):
    ssl_options = options.create_ssl_options() if options.ssl_keyfile else None

    if options.watch or "in-memory" in {BROADCAST_TYPE, CACHE_TYPE}:
        options.workers = 1

    DbUpgradeCommand().execute(DbUpgradeCommandOptions())

    AppConfig.create(
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
