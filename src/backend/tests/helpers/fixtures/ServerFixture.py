from unittest.mock import MagicMock
from langboard.core.routing import SocketRequest, WebSocket
from pytest import fixture
from ..mocks import MockSocketifyRequest, MockSocketifyResponse, MockSocketifyWebSocket


class ServerFixture:
    @fixture(scope="class", autouse=True)
    def _mock_request(self) -> MockSocketifyRequest:
        return MockSocketifyRequest()

    @fixture(scope="class", autouse=True)
    def _mock_response(self) -> MockSocketifyResponse:
        return MockSocketifyResponse()

    @fixture(scope="class", autouse=True)
    def _mock_socketify_websocket(self) -> MockSocketifyWebSocket:
        return MockSocketifyWebSocket()

    @fixture(scope="class", autouse=True)
    def _mock_context(self) -> MagicMock:
        return MagicMock()

    def _create_app_request(
        self, websocket: MockSocketifyWebSocket, route_data: dict, data: dict | list, from_app: dict | None = None
    ) -> SocketRequest:
        return SocketRequest(WebSocket(websocket), route_data, data, from_app=from_app)
