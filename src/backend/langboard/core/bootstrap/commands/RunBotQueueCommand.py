from asyncio import run
from ....Loader import load_modules
from ...ai import QueueBot
from ..BaseCommand import BaseCommand, BaseCommandOptions


class RunQueueBotCommandOptions(BaseCommandOptions):
    pass


class RunQueueBotCommand(BaseCommand):
    @property
    def option_class(self) -> type[RunQueueBotCommandOptions]:
        return RunQueueBotCommandOptions

    @property
    def command(self) -> str:
        return "queue:bot"

    @property
    def positional_name(self) -> str:
        return ""

    @property
    def description(self) -> str:
        return "Run the queue bot loop"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return bool

    def execute(self, _: RunQueueBotCommandOptions) -> None:
        load_modules("bots", "Bot", log=True)
        queue = QueueBot()
        run(queue.loop())
