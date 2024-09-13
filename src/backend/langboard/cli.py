from os import environ
from argparse import SUPPRESS
from rich import print as rprint
from .core.bootstrap import CLIHelpFormatter, CLIRichParser, CLIOptions
from .core.db import create_model
from .App import App


arg_parser = CLIRichParser(argument_default=SUPPRESS, formatter_class=CLIHelpFormatter)
groups = {}
for field_name, field in CLIOptions.model_fields.items():
    field_name = field_name.replace("_", "-")
    names = []
    arg_setting = {
        "help": field.description or None,
        "required": field.is_required(),
        "default": field.default,
    }

    if "is_command" in (field.json_schema_extra or {}) and field.json_schema_extra["is_command"]:
        arg_setting.pop("required")
        names.append(field_name)
        if "nargs" in (field.json_schema_extra or {}):
            arg_setting["nargs"] = field.json_schema_extra["nargs"]
        if "metavar" in (field.json_schema_extra or {}):
            arg_setting["metavar"] = field.json_schema_extra["metavar"]
    else:
        if "short" in (field.json_schema_extra or {}):
            short_name = field.json_schema_extra["short"]
            names.append(f"-{short_name}")

        names.append(f"--{field_name}")

    if "group" in (field.json_schema_extra or {}):
        group_name = field.json_schema_extra["group"]
        group = groups.get(group_name)
        if not group:
            group = arg_parser.add_argument_group(f"{group_name} options")
            groups[group_name] = group
    else:
        group = arg_parser

    if field.annotation is int:
        arg_setting["type"] = field.annotation
    elif field.annotation is bool:
        arg_setting["action"] = "store_true"

    group.add_argument(*names, **arg_setting)


def execute():
    args, _ = arg_parser.parse_known_args(namespace=CLIOptions())
    commands = args.command or []
    if not commands or commands.count("help") > 0:
        arg_parser.print_help()
        return

    #
    if args.version:
        return args.print_version()

    elif commands[0] == "model":
        if len(commands) < 2:
            arg_parser.print_help()
            return
        create_model(commands[1], args.soft_delete)
        return

    elif commands[0] == "run":
        workers = args.workers
        if workers < 1:
            workers = 1

        host = environ.get("BACKEND_HOST", "localhost")
        port = int(environ.get("BACKEND_PORT", "5381"))

        ssl_options = args.create_ssl_options() if args.ssl_keyfile else None

        websocket_options = args.create_websocket_options()

        app = App(
            host=host,
            port=port,
            uds=args.uds,
            lifespan=args.lifespan,
            ssl_options=ssl_options,
            ws_options=websocket_options,
            workers=args.workers,
            task_factory_maxitems=args.task_factory_maxitems,
        )

        app.run()

    else:
        rprint(f"[red]Unknown command: [bold{commands[0]}[/bold][/red]")
        arg_parser.print_help()
