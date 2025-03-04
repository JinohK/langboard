from ....Loader import load_modules
from ...ai import BaseBot, InternalBotType
from ..BaseCommand import BaseCommand, BaseCommandOptions
from .CommandUtils import create_bot_py, format_template


class CreateBotCommandOptions(BaseCommandOptions):
    pass


class CreateBotCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[CreateBotCommandOptions]:
        return CreateBotCommandOptions

    @property
    def command(self) -> str:
        return "bot:new"

    @property
    def positional_name(self) -> str:
        return "bot type"

    @property
    def description(self) -> str:
        return "Bot to create (You must choose one of PascalCase and snake_case in pairs of choices)."

    @property
    def choices(self) -> list[str] | None:
        choices = []
        for name, value in self.__get_available_bots():
            choices.append(name)
            choices.append(value)
        return choices

    @property
    def choices_description(self) -> list[str] | None:
        available_bots = self.__get_available_bots()
        return [str(bot) for bot in available_bots]

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, bot_type_str: str, _: CreateBotCommandOptions) -> None:
        """Creates a new bot file in the bots directory."""
        is_pascal_case = bot_type_str[0].isupper()
        if is_pascal_case:
            bot_type = InternalBotType[bot_type_str]
        else:
            bot_type = InternalBotType(bot_type_str)

        formats = {
            "bot_type": bot_type.name,
        }

        code = format_template("bot", formats)

        create_bot_py(bot_type.name, code)

    def __get_available_bots(self) -> list[tuple[str, str]]:
        load_modules("bots", "Bot", log=False)
        available_bots = [(bot_type.name, bot_type.value) for bot_type in InternalBotType]
        for bot_type in BaseBot.__bots__.keys():
            if (bot_type.name, bot_type.value) in available_bots:
                available_bots.remove((bot_type.name, bot_type.value))
        return available_bots
