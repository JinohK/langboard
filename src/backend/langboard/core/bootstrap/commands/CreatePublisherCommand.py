from ..BaseCommand import BaseCommand, BaseCommandOptions
from .CommandUtils import create_publisher_py, format_template, make_name


class CreatePublisherCommandOptions(BaseCommandOptions):
    pass


class CreatePublisherCommand(BaseCommand):
    @property
    def option_class(self) -> type[CreatePublisherCommandOptions]:
        return CreatePublisherCommandOptions

    @property
    def command(self) -> str:
        return "pub:new"

    @property
    def positional_name(self) -> str:
        return "publisher name"

    @property
    def description(self) -> str:
        return "Publisher to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Publisher' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, service_name: str, _: CreatePublisherCommandOptions) -> None:
        name = make_name(service_name, "Publisher")

        formats = {
            "class_name": name,
        }

        code = format_template("publisher", formats)

        create_publisher_py(name, code)
