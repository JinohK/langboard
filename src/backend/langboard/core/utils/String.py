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
