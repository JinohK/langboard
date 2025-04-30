from re import compile, findall
from typing import Literal
from ..db import EditorContentModel


TDataText = Literal["audio", "date", "file", "mention", "video"]

DATA_TEXT_WRAPPER_MAP: dict[TDataText, dict[str, str]] = {
    "audio": {"start": "au", "end": "ua"},
    "date": {"start": "dt", "end": "td"},
    "file": {"start": "fl", "end": "lf"},
    "mention": {"start": "mn", "end": "nm"},
    "video": {"start": "vd", "end": "dv"},
}

DATA_TEXT_FORMAT_DESCRIPTIONS: dict[str, str] = {
    "audio": f"Audio url format: !([{DATA_TEXT_WRAPPER_MAP['audio']['start']}]:protocol:host])path([/{DATA_TEXT_WRAPPER_MAP['audio']['end']}])",
    "date": f"Date format: !([{DATA_TEXT_WRAPPER_MAP['date']['start']}])yyyy-MM-dd([/{DATA_TEXT_WRAPPER_MAP['date']['end']}])",
    "file": f"File url format: !([{DATA_TEXT_WRAPPER_MAP['file']['start']}]:protocol:host:path])filename([/{DATA_TEXT_WRAPPER_MAP['file']['end']}])",
    "mention": f"User mention format: !([{DATA_TEXT_WRAPPER_MAP['mention']['start']}]:target_uid:target_username])([/{DATA_TEXT_WRAPPER_MAP['mention']['end']}])",
    "video": f"Video url format: !([{DATA_TEXT_WRAPPER_MAP['video']['start']}]:protocol:host])path([/{DATA_TEXT_WRAPPER_MAP['video']['end']}])",
}


def create_editor_data_type_regex(data_type: TDataText, param_length: int, has_value: bool):
    wrapper = DATA_TEXT_WRAPPER_MAP[data_type]
    wrapper_start = wrapper["start"]
    wrapper_end = wrapper["end"]
    value_regex = "(.*?)" if has_value else ""
    param_regex = ""
    for _ in range(param_length):
        param_regex = f"{param_regex}:(.*?)"
    return compile(rf"!\(\[{wrapper_start}{param_regex}\]\){value_regex}\(\[/{wrapper_end}\]\)")


def create_editor_data_type_str(data_type: TDataText, params: list[str], value: str = ""):
    wrapper = DATA_TEXT_WRAPPER_MAP[data_type]
    wrapper_start = wrapper["start"]
    wrapper_end = wrapper["end"]
    param_str = ""
    for param in params:
        param_str = f"{param_str}:{param}"
    return f"!([{wrapper_start}{param_str}]){value}([/{wrapper_end}])"


def find_mentioned(editor: EditorContentModel) -> tuple[set[str], dict[str, str]]:
    mention_pattern = create_editor_data_type_regex("mention", 2, False)
    mentions = findall(mention_pattern, editor.content)

    content = change_date_element(editor)

    result: set[str] = set()
    mentioned_lines: dict[str, str] = {}
    for user_uid, username in mentions:
        if user_uid in result:
            continue
        result.add(user_uid)
        mention_str = create_editor_data_type_str("mention", [user_uid, username])
        content_lines = content.split(mention_str)
        if len(content_lines) < 2:
            mentioned_lines[user_uid] = mention_str
            continue
        front_lines = content_lines[0].splitlines()
        front_line = front_lines.pop() if front_lines else ""
        last_lines = content_lines[1].splitlines()
        last_line = last_lines.pop(0) if last_lines else ""
        mentioned_lines[user_uid] = f"{front_line}{mention_str}{last_line}"

    return result, mentioned_lines


def change_date_element(editor: EditorContentModel) -> str:
    if not editor.content:
        return ""

    content = editor.content
    date_regex = create_editor_data_type_regex("date", 1, False)
    date_matches = findall(date_regex, content)
    for date in date_matches:
        date_str = create_editor_data_type_str("date", [date])
        content = content.replace(date_str, date)
    return content
