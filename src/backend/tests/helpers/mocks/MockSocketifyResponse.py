from unittest.mock import Mock
from socketify import Response
from .BaseMagicMock import BaseMagicMock


class MockSocketifyResponse(BaseMagicMock):
    def __init__(self):
        super().__init__(spec=Response)
        self._cork = Mock(name="cork")
        self._set_cookie = Mock(name="set_cookie")
        self._trigger_aborted = Mock(name="trigger_aborted")
        self._trigger_data_handler = Mock(name="trigger_data_handler")
        self._trigger_writable_handler = Mock(name="trigger_writable_handler")
        self._run_async = Mock(name="run_async")
        self._get_form_urlencoded = Mock(name="get_form_urlencoded")
        self._get_text = Mock(name="get_text")
        self._get_json = Mock(name="get_json")
        self._send_chunk = Mock(name="send_chunk")
        self._get_data = Mock(name="get_data")
        self._grab_aborted_handler = Mock(name="grab_aborted_handler")
        self._redirect = Mock(name="redirect")
        self._write_offset = Mock(name="write_offset")
        self._close = Mock(name="close")
        self._try_end = Mock(name="try_end")
        self._cork_end = Mock(name="cork_end")
        self._render = Mock(name="render")
        self._get_remote_address_bytes = Mock(name="get_remote_address_bytes")
        self._get_remote_address = Mock(name="get_remote_address")
        self._get_proxied_remote_address_bytes = Mock(name="get_proxied_remote_address_bytes")
        self._get_proxied_remote_address = Mock(name="get_proxied_remote_address")
        self._cork_send = Mock(name="cork_send")
        self._send = Mock(name="send")
        self._end = Mock(name="end")
        self._pause = Mock(name="pause")
        self._resume = Mock(name="resume")
        self._write_continue = Mock(name="write_continue")
        self._write_status = Mock(name="write_status")
        self._write_header = Mock(name="write_header")
        self._end_without_body = Mock(name="end_without_body")
        self._write = Mock(name="write")
        self._get_write_offset = Mock(name="get_write_offset")
        self._has_responded = Mock(name="has_responded")
        self._on_aborted = Mock(name="on_aborted")
        self._on_data = Mock(name="on_data")
        self._upgrade = Mock(name="upgrade")
        self._on_writable = Mock(name="on_writable")
        self._get_native_handle = Mock(name="get_native_handle")

    @property
    def cork(self) -> Mock:
        return self._cork

    @property
    def set_cookie(self) -> Mock:
        return self._set_cookie

    @property
    def trigger_aborted(self) -> Mock:
        return self._trigger_aborted

    @property
    def trigger_data_handler(self) -> Mock:
        return self._trigger_data_handler

    @property
    def trigger_writable_handler(self) -> Mock:
        return self._trigger_writable_handler

    @property
    def run_async(self) -> Mock:
        return self._run_async

    @property
    def get_form_urlencoded(self) -> Mock:
        return self._get_form_urlencoded

    @property
    def get_text(self) -> Mock:
        return self._get_text

    @property
    def get_json(self) -> Mock:
        return self._get_json

    @property
    def send_chunk(self) -> Mock:
        return self._send_chunk

    @property
    def get_data(self) -> Mock:
        return self._get_data

    @property
    def grab_aborted_handler(self) -> Mock:
        return self._grab_aborted_handler

    @property
    def redirect(self) -> Mock:
        return self._redirect

    @property
    def write_offset(self) -> Mock:
        return self._write_offset

    @property
    def close(self) -> Mock:
        return self._close

    @property
    def try_end(self) -> Mock:
        return self._try_end

    @property
    def cork_end(self) -> Mock:
        return self._cork_end

    @property
    def render(self) -> Mock:
        return self._render

    @property
    def get_remote_address_bytes(self) -> Mock:
        return self._get_remote_address_bytes

    @property
    def get_remote_address(self) -> Mock:
        return self._get_remote_address

    @property
    def get_proxied_remote_address_bytes(self) -> Mock:
        return self._get_proxied_remote_address_bytes

    @property
    def get_proxied_remote_address(self) -> Mock:
        return self._get_proxied_remote_address

    @property
    def cork_send(self) -> Mock:
        return self._cork_send

    @property
    def send(self) -> Mock:
        return self._send

    @property
    def end(self) -> Mock:
        return self._end

    @property
    def pause(self) -> Mock:
        return self._pause

    @property
    def resume(self) -> Mock:
        return self._resume

    @property
    def write_continue(self) -> Mock:
        return self._write_continue

    @property
    def write_status(self) -> Mock:
        return self._write_status

    @property
    def write_header(self) -> Mock:
        return self._write_header

    @property
    def end_without_body(self) -> Mock:
        return self._end_without_body

    @property
    def write(self) -> Mock:
        return self._write

    @property
    def get_write_offset(self) -> Mock:
        return self._get_write_offset

    @property
    def has_responded(self) -> Mock:
        return self._has_responded

    @property
    def on_aborted(self) -> Mock:
        return self._on_aborted

    @property
    def on_data(self) -> Mock:
        return self._on_data

    @property
    def upgrade(self) -> Mock:
        return self._upgrade

    @property
    def on_writable(self) -> Mock:
        return self._on_writable

    @property
    def get_native_handle(self) -> Mock:
        return self._get_native_handle
