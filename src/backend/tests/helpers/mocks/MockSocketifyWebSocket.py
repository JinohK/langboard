from unittest.mock import Mock
from socketify import WebSocket as SocketifyWebSocket
from .BaseMagicMock import BaseMagicMock


class MockSocketifyWebSocket(BaseMagicMock):
    def __init__(self):
        super().__init__(spec=[SocketifyWebSocket])
        self.ws = None
        self._ptr = None
        self.app = None
        self._cork_handler = None
        self._for_each_topic_handler = None
        self.socket_data_id = None
        self.socket_data = None
        self.got_socket_data = None
        self._clone = Mock(name="clone")
        self._trigger_for_each_topic_handler = Mock(name="trigger_for_each_topic_handler")
        self._get_user_data_uuid = Mock(name="get_user_data_uuid")
        self._get_user_data = Mock(name="get_user_data")
        self._get_buffered_amount = Mock(name="get_buffered_amount")
        self._subscribe = Mock(name="subscribe")
        self._unsubscribe = Mock(name="unsubscribe")
        self._is_subscribed = Mock(name="is_subscribed")
        self._publish = Mock(name="publish")
        self._get_topics = Mock(name="get_topics")
        self._for_each_topic = Mock(name="for_each_topic")
        self._get_remote_address_bytes = Mock(name="get_remote_address_bytes")
        self._get_remote_address = Mock(name="get_remote_address")
        self._send_fragment = Mock(name="send_fragment")
        self._send_last_fragment = Mock(name="send_last_fragment")
        self._send_first_fragment = Mock(name="send_first_fragment")
        self._cork_send = Mock(name="cork_send")
        self._send = Mock(name="send")
        self._cork_end = Mock(name="cork_end")
        self._end = Mock(name="end")
        self._close = Mock(name="close")
        self._cork = Mock(name="cork")

    @property
    def clone(self) -> Mock:
        return self._clone

    @property
    def trigger_for_each_topic_handler(self) -> Mock:
        return self._trigger_for_each_topic_handler

    @property
    def get_user_data_uuid(self) -> Mock:
        return self._get_user_data_uuid

    @property
    def get_user_data(self) -> Mock:
        return self._get_user_data

    @property
    def get_buffered_amount(self) -> Mock:
        return self._get_buffered_amount

    @property
    def subscribe(self) -> Mock:
        return self._subscribe

    @property
    def unsubscribe(self) -> Mock:
        return self._unsubscribe

    @property
    def is_subscribed(self) -> Mock:
        return self._is_subscribed

    @property
    def publish(self) -> Mock:
        return self._publish

    @property
    def get_topics(self) -> Mock:
        return self._get_topics

    @property
    def for_each_topic(self) -> Mock:
        return self._for_each_topic

    @property
    def get_remote_address_bytes(self) -> Mock:
        return self._get_remote_address_bytes

    @property
    def get_remote_address(self) -> Mock:
        return self._get_remote_address

    @property
    def send_fragment(self) -> Mock:
        return self._send_fragment

    @property
    def send_last_fragment(self) -> Mock:
        return self._send_last_fragment

    @property
    def send_first_fragment(self) -> Mock:
        return self._send_first_fragment

    @property
    def cork_send(self) -> Mock:
        return self._cork_send

    @property
    def send(self) -> Mock:
        return self._send

    @property
    def cork_end(self) -> Mock:
        return self._cork_end

    @property
    def end(self) -> Mock:
        return self._end

    @property
    def close(self) -> Mock:
        return self._close

    @property
    def cork(self) -> Mock:
        return self._cork
