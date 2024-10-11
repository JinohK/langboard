from datetime import datetime
from os import urandom


def concat(*strs: str) -> str:
    """Concatenates the strings into one string.

    Use this instead of the `+` operator to concatenate strings.
    """
    return "".join(strs)


def capitalize_all_words(string: str) -> str:
    """Capitalizes all words in the string.

    Args:
        string (str): The string to capitalize.

    Returns:
        str: The capitalized string.
    """
    return " ".join(word.capitalize() for word in string.split(" "))


def get_random_filename(file_name: str | None) -> str:
    extension = file_name.split(".")[-1] if file_name else ""

    return concat(str(int(datetime.now().timestamp())), urandom(10).hex(), ".", extension)
