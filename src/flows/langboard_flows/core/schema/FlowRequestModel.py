from langflow.schema.schema import InputType, OutputType
from pydantic import BaseModel, Field


class FlowRequestModel(BaseModel):
    input_value: str | None = Field(default=None, description="The input value")
    input_type: InputType | None = Field(default="chat", description="The input type")
    output_type: OutputType | None = Field(default="chat", description="The output type")
    output_component: str | None = Field(
        default="",
        description="If there are multiple output components, you can specify the component to get the output from.",
    )
    tweaks: dict | None = Field(default=None, description="The tweaks")
    session_id: str = Field(..., description="The session id")
    run_type: str = Field(..., description="The run type (internal_bot, bot)")
    uid: str = Field(...)
    project_uid: str | None = Field(default=None, description="The project uid")
    log_uid: str | None = Field(default=None, description="The bot log uid")
    scope_log_table: str | None = Field(default=None, description="The scope bot log table")
