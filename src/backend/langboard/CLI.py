from argparse import SUPPRESS
from rich import print as rprint
from .App import App
from .Constants import HOST, PORT
from .core.bootstrap import CLIHelpFormatter, CLIOptions, CLIRichParser
from .core.db import create_model


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

    extra = field.json_schema_extra or {}
    if callable(extra):
        extra = {}

    if "is_command" in extra and extra["is_command"]:
        arg_setting.pop("required")
        names.append(field_name)
        if "nargs" in extra:
            arg_setting["nargs"] = extra["nargs"]
        if "metavar" in extra:
            arg_setting["metavar"] = extra["metavar"]
    else:
        if "short" in extra:
            short_name = extra["short"]
            names.append(f"-{short_name}")

        names.append(f"--{field_name}")

    if "group" in extra:
        group_name = extra["group"]
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

        ssl_options = args.create_ssl_options() if args.ssl_keyfile else None

        websocket_options = args.create_websocket_options()

        app = App(
            host=HOST,
            port=PORT,
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
