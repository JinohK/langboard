from os import urandom
from random import randint, shuffle
from string import ascii_lowercase, ascii_uppercase, digits
from .DateTime import now


BASE62_ALPHABET = f"{digits}{ascii_lowercase}{ascii_uppercase}"


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


def generate_random_string(length: int) -> str:
    """Generates a random string.

    Args:
        length (int): The length of the string to generate.

    Returns:
        str: The generated string.
    """
    return "".join(BASE62_ALPHABET[randint(0, len(BASE62_ALPHABET) - 1)] for _ in range(length))


def make_fullname(first_name: str, last_name: str) -> str:
    """Creates a full name from the first and last name.

    Args:
        first_name (str): The first name.
        last_name (str): The last name.

    Returns:
        str: The full name.
    """
    return f"{first_name} {last_name}"


def create_short_unique_id(length: int) -> str:
    ascii_ranges = [
        (ord("0"), ord("9")),
        (ord("a"), ord("z")),
        (ord("A"), ord("Z")),
    ]

    unique_chars: list[str] = []

    for _ in range(length):
        shuffle(ascii_ranges)
        ascii_range = ascii_ranges[randint(0, 2)]
        unique_chars.append(chr(randint(ascii_range[0], ascii_range[1])))

    return concat(*unique_chars)


def get_random_filename(file_name: str | None) -> str:
    extension = file_name.split(".")[-1] if file_name else ""

    return concat(str(int(now().timestamp())), urandom(10).hex(), ".", extension)


def pascal_to_snake(pascal_str: str):
    snake_chars: list[str] = []
    for char in pascal_str:
        if char.isupper() and snake_chars:
            snake_chars.append("_")
        snake_chars.append(char.lower())
    return concat(*snake_chars)


def snake_to_pascal(snake_str: str):
    return "".join(word.capitalize() for word in snake_str.split("_"))
