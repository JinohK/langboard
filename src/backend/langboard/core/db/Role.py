from enum import Enum


class DbSessionRole(Enum):
    Select = "SELECT"
    Insert = "INSERT"
    Update = "UPDATE"
    Delete = "DELETE"
