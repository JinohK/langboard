from .....helpers.fixtures import ServerFixture


class BaseScopeTest(ServerFixture):
    _event_details = {
        "route": "route",
        "event": "event",
        "func": "func",
    }
