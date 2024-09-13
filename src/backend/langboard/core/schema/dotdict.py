from typing import MutableMapping, TypeVar


_KT = TypeVar("_KT")
_VT = TypeVar("_VT")


class dotdict(dict, MutableMapping[_KT, _VT]):
    """A dictionary that allows attribute access to its keys.

    E.g.::

        data: dotdict = dotdict()
        data: dotdict[str, int] = dotdict()

        data.key = 1
        data["key"] = 1

        key2 = data.key2  # Raises AttributeError
        del data.key2  # Raises AttributeError

    :exception:`AttributeError` are raised if the attribute does not exist.
    """

    def __getattr__(self, attr):
        try:
            value = self[attr]
            if isinstance(value, dict) and not isinstance(value, dotdict):
                value = dotdict(value)
                self[attr] = value
            return value
        except KeyError:
            raise AttributeError(f"'dotdict' object has no attribute '{attr}'")

    def __setattr__(self, key, value):
        if isinstance(value, dict) and not isinstance(value, dotdict):
            value = dotdict(value)
        self[key] = value

    def __delattr__(self, key):
        try:
            del self[key]
        except KeyError:
            raise AttributeError(f"'dotdict' object has no attribute '{key}'")

    def __missing__(self, key):
        return dotdict()
