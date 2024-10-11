from typing import Literal, TypeVar, Union, overload


_TKey = TypeVar("_TKey")
_TValue = TypeVar("_TValue")


class DotDict(dict[_TKey, _TValue]):
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

    def __getattr__(self, attr: _TKey) -> _TValue | None:
        value = self[attr]
        if isinstance(value, dict) and not isinstance(value, DotDict):
            value = DotDict(value)
            self[attr] = value  # type: ignore
        return value  # type: ignore

    def __setattr__(self, key: _TKey, value: _TValue) -> None:
        if isinstance(value, dict) and not isinstance(value, DotDict):
            value = DotDict(value)  # type: ignore
        self[key] = value

    def __delattr__(self, key: _TKey):
        try:
            del self[key]
        except KeyError:
            raise AttributeError(f"'DotDict' object has no attribute '{key}'")

    def __missing__(self, _: _TKey):
        return None

    def __str__(self) -> str:
        new_dict = self.copy(as_dict=True)
        return str(new_dict)

    def __repr__(self) -> str:
        return str(self)

    def __len__(self) -> int:
        new_dict = self.copy(as_dict=True)
        return len(new_dict)

    def __eq__(self, value: object) -> bool:
        if not isinstance(value, dict) and not isinstance(value, DotDict):
            return False

        if len(self) != len(value):
            return False

        for key, value in value.items():
            if key == "__orig_class__":
                continue

            if key not in self or self[key] != value:
                return False

        return True

    def __ne__(self, value: object) -> bool:
        return not self.__eq__(value)

    @overload
    def copy(self) -> "DotDict[_TKey, _TValue]": ...
    @overload
    def copy(self, as_dict: Literal[False]) -> "DotDict[_TKey, _TValue]": ...
    @overload
    def copy(self, as_dict: Literal[True]) -> dict[_TKey, _TValue]: ...
    def copy(self, as_dict: bool = False) -> Union["DotDict[_TKey, _TValue]", dict[_TKey, _TValue]]:
        new_dict = super().copy()
        if "__orig_class__" in new_dict:
            new_dict.pop("__orig_class__")  # type: ignore
        if as_dict:
            return new_dict
        else:
            return DotDict(new_dict)
