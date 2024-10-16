from datetime import datetime
from os import urandom
from random import randint, shuffle


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


def create_short_unique_id(length: int) -> str:
    DIGIT_FIRST_ASCII = ord("0")
    DIGIT_LAST_ASCII = ord("9")
    LOWERCASE_FIRST_ASCII = ord("a")
    LOWERCASE_LAST_ASCII = ord("z")
    UPPERCASE_FIRST_ASCII = ord("A")
    UPPERCASE_LAST_ASCII = ord("Z")

    ascii_ranges = [
        (DIGIT_FIRST_ASCII, DIGIT_LAST_ASCII),
        (LOWERCASE_FIRST_ASCII, LOWERCASE_LAST_ASCII),
        (UPPERCASE_FIRST_ASCII, UPPERCASE_LAST_ASCII),
    ]

    unique_chars: list[str] = []

    for _ in range(length):
        shuffle(ascii_ranges)
        ascii_range = ascii_ranges[randint(0, 2)]
        unique_chars.append(chr(randint(ascii_range[0], ascii_range[1])))

    return concat(*unique_chars)


def get_random_filename(file_name: str | None) -> str:
    extension = file_name.split(".")[-1] if file_name else ""

    return concat(str(int(datetime.now().timestamp())), urandom(10).hex(), ".", extension)


def pascal_to_snake(pascal_str: str):
    snake_chars: list[str] = []
    for char in pascal_str:
        if char.isupper() and snake_chars:
            snake_chars.append("_")
        snake_chars.append(char.lower())
    return concat(*snake_chars)


def snake_to_pascal(snake_str: str):
    return "".join(word.capitalize() for word in snake_str.split("_"))
