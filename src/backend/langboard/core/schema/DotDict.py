from typing import MutableMapping, TypeVar


_KT = TypeVar("_KT")
_VT = TypeVar("_VT")


class DotDict(dict[_KT, _VT], MutableMapping[_KT, _VT]):
    """A dictionary that allows attribute access to its keys.

    E.g.::

        data: DotDict = DotDict()
        data: DotDict[str, int] = DotDict()

        data.key = 1
        data["key"] = 1

        key2 = data.key2  # Raises AttributeError
        del data.key2  # Raises AttributeError

    :exception:`AttributeError` are raised if the attribute does not exist.
    """

    def __getattr__(self, attr):
        try:
            value = self[attr]
            if isinstance(value, dict) and not isinstance(value, DotDict):
                value = DotDict(value)
                self[attr] = value
            return value
        except KeyError:
            raise AttributeError(f"'DotDict' object has no attribute '{attr}'")

    def __setattr__(self, key, value):
        if isinstance(value, dict) and not isinstance(value, DotDict):
            value = DotDict(value)
        self[key] = value

    def __delattr__(self, key):
        try:
            del self[key]
        except KeyError:
            raise AttributeError(f"'DotDict' object has no attribute '{key}'")

    def __missing__(self, key):
        return None

    def __str__(self) -> str:
        if hasattr(self, "__orig_class__"):
            dict_data = dict(self.items())
            del dict_data["__orig_class__"]
            return str(dict_data)
        return super().__str__()

    def __repr__(self) -> str:
        return str(self)

    def __len__(self) -> int:
        if hasattr(self, "__orig_class__"):
            return super().__len__() - 1
        return super().__len__()

    def __eq__(self, value: object) -> bool:
        if not isinstance(value, dict):
            return False

        if len(self) != len(value):
            return False

        for key, value in value.items():
            if key not in self or self[key] != value:
                return False

        return True
