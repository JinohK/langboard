from core.bootstrap import BaseCommand, BaseCommandOptions
from ..core.broker import Broker
from ..Loader import load_modules


class RunBrokerCommandOptions(BaseCommandOptions):
    pass


class RunBrokerCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return False

    @property
    def option_class(self) -> type[RunBrokerCommandOptions]:
        return RunBrokerCommandOptions

    @property
    def command(self) -> str:
        return "run:broker"

    @property
    def positional_name(self) -> str:
        return ""

    @property
    def description(self) -> str:
        return "Run the broker service"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return bool

    def execute(self, _: RunBrokerCommandOptions) -> None:
        load_modules("tasks", "Task")

        Broker.start()
