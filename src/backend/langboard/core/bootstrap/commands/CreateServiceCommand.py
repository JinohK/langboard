from ...utils.String import pascal_to_snake
from ..BaseCommand import BaseCommand, BaseCommandOptions
from .utils import create_service_py, format_template, make_name


class CreateServiceCommandOptions(BaseCommandOptions):
    pass


class CreateServiceCommand(BaseCommand):
    @property
    def option_class(self) -> type[CreateServiceCommandOptions]:
        return CreateServiceCommandOptions

    @property
    def command(self) -> str:
        return "service:new"

    @property
    def positional_name(self) -> str:
        return "service name"

    @property
    def description(self) -> str:
        return "Service to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Service' suffix)"

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, service_name: str, _: CreateServiceCommandOptions) -> None:
        name = make_name(service_name, "Service")

        formats = {
            "class_name": name,
            "snake_name": pascal_to_snake(name),
        }

        code = format_template("service", formats)

        create_service_py(name, code, is_role=False)
