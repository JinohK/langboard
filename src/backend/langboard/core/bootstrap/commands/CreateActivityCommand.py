from ..BaseCommand import BaseCommand, BaseCommandOptions
from .CommandUtils import create_model_py, format_template, make_name


class CreateActivityCommandOptions(BaseCommandOptions):
    pass


class CreateActivityCommand(BaseCommand):
    @property
    def option_class(self) -> type[CreateActivityCommandOptions]:
        return CreateActivityCommandOptions

    @property
    def command(self) -> str:
        return "activity:new"

    @property
    def positional_name(self) -> str:
        return "activity name"

    @property
    def description(self) -> str:
        return "Activity to create (You must choose one of PascalCase and snake_case in pairs of choices)."

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, activity_name: str, _: CreateActivityCommandOptions) -> None:
        name = make_name(activity_name, "Activity")

        formats = {
            "class_name": name,
        }

        model_code = format_template("activity_sql_model", formats)
        create_model_py(f"{name}Activity", model_code)
