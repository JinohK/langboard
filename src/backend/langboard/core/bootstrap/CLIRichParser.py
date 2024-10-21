from argparse import ArgumentParser
from rich import print as rprint
from ...Constants import PROJECT_NAME, PROJECT_VERSION


class CLIRichParser(ArgumentParser):
    _color_base = "not white bold"
    _color_positional_name = "dim"
    _color_group = "color(138)"
    _color_command = "color(153) bold"
    _color_description = "color(144)"
    _color_prog = "cyan bold"

    def _print_message(self, message, file=None):
        if not message or not message.startswith("usage:"):
            return

        usage_only = None
        options: list[str] = []
        short_options: list[str] = []
        positionals = []
        help_texts = []

        for action in self._actions:
            if action.option_strings:
                for option in action.option_strings:
                    if action.help:
                        help_texts.append(action.help)
                    if option.startswith("--"):
                        options.append(option)
                    else:
                        short_options.append(option)
            else:
                if action.metavar:
                    if "show_usage_only" in action.metavar:
                        usage_only = action
                    else:
                        for metavar in action.metavar:
                            help_texts.append(action.metavar[metavar]["help"])  # type: ignore
                            if (
                                "positional_name" in action.metavar[metavar]  # type: ignore
                                and action.metavar[metavar]["positional_name"]  # type: ignore
                            ):
                                positionals.append(f"{metavar} <{action.metavar[metavar]["positional_name"]}>")  # type: ignore
                            positionals.append(metavar)
                else:
                    if action.help:
                        help_texts.append(action.help)
                    positionals.append(action.dest)

        for positional in positionals:
            message = message.replace(
                f"{positional} options:", f"[{self._color_group}]{positional.upper()} OPTIONS[/{self._color_group}]:"
            )

        message = (
            f"{PROJECT_NAME} [{self._color_prog}]v{PROJECT_VERSION}[/{self._color_prog}]\n\n{message}".replace(
                "usage:", f"[{self._color_group}]USAGE[/{self._color_group}]:"
            )
            .replace("positional arguments:", f"[{self._color_group}]COMMANDS[/{self._color_group}]:")
            .replace("options:", f"[{self._color_group}]OPTIONS[/{self._color_group}]:")
            .replace(PROJECT_NAME, f"[{self._color_prog}]{PROJECT_NAME}[/{self._color_prog}]")
        )

        for help_text in help_texts:
            message = message.replace(
                f"{help_text}", f"[{self._color_description}]{help_text}[/{self._color_description}]"
            )

        options.extend(short_options)
        for option in options:
            message = message.replace(option, f"[{self._color_command}]{option}[/{self._color_command}]")

        for positional in positionals:
            if "<" in positional and ">" in positional:
                pos = positional.split(" ")
                pos1 = pos[0]
                pos2 = " ".join(pos[1:]).replace("<", "＜").replace(">", "＞")
                message = message.replace(
                    positional,
                    f"[{self._color_command}]{pos1}[/{self._color_command}] [{self._color_positional_name}]{pos2}[/{self._color_positional_name}]",
                )
            else:
                message = (
                    message.replace(
                        f"  {positional} ", f"  [{self._color_command}]{positional}[/{self._color_command}] "
                    )
                    .replace(f"|{positional}", f"|[{self._color_command}]{positional}[/{self._color_command}]")
                    .replace(f"{positional}|", f"[{self._color_command}]{positional}[/{self._color_command}]|")
                )

        if usage_only:
            message = message.replace(
                f"{usage_only.metavar["command_name"]} <{usage_only.metavar["positional_name"]}>",  # type: ignore
                f"[{self._color_command}]{usage_only.metavar["command_name"]}[/{self._color_command}] ＜[{self._color_positional_name}]{usage_only.metavar["positional_name"]}[/{self._color_positional_name}]＞",  # type: ignore
            ).replace(
                f"<{usage_only.metavar["command_name"]}>",  # type: ignore
                f"[{self._color_command}]{usage_only.metavar["command_name"]}[/{self._color_command}]",  # type: ignore
            )  # type: ignore

        message = f"[{self._color_base}]{message.strip()}[/{self._color_base}]"
        rprint(message)
