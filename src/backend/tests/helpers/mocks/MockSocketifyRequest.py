from unittest.mock import Mock
from socketify import Request
from .BaseMagicMock import BaseMagicMock


class MockSocketifyRequest(BaseMagicMock):
    def __init__(self):
        super().__init__(spec=Request)
        self._get_cookie = Mock(name="get_cookie")
        self._get_url = Mock(name="get_url")
        self._get_full_url = Mock(name="get_full_url")
        self._get_method = Mock(name="get_method")
        self._for_each_header = Mock(name="for_each_header")
        self._get_headers = Mock(name="get_headers")
        self._get_header = Mock(name="get_header")
        self._get_queries = Mock(name="get_queries")
        self._get_query = Mock(name="get_query")
        self._get_parameters = Mock(name="get_parameters")
        self._get_parameter = Mock(name="get_parameter")
        self._preserve = Mock(name="preserve")
        self._set_yield = Mock(name="set_yield")
        self._get_yield = Mock(name="get_yield")
        self._is_ancient = Mock(name="is_ancient")
        self._trigger_for_each_header_handler = Mock(name="trigger_for_each_header_handler")

    @property
    def get_cookie(self) -> Mock:
        return self._get_cookie

    @property
    def get_url(self) -> Mock:
        return self._get_url

    @property
    def get_full_url(self) -> Mock:
        return self._get_full_url

    @property
    def get_method(self) -> Mock:
        return self._get_method

    @property
    def for_each_header(self) -> Mock:
        return self._for_each_header

    @property
    def get_headers(self) -> Mock:
        return self._get_headers

    @property
    def get_header(self) -> Mock:
        return self._get_header

    @property
    def get_queries(self) -> Mock:
        return self._get_queries

    @property
    def get_query(self) -> Mock:
        return self._get_query

    @property
    def get_parameters(self) -> Mock:
        return self._get_parameters

    @property
    def get_parameter(self) -> Mock:
        return self._get_parameter

    @property
    def preserve(self) -> Mock:
        return self._preserve

    @property
    def set_yield(self) -> Mock:
        return self._set_yield

    @property
    def get_yield(self) -> Mock:
        return self._get_yield

    @property
    def is_ancient(self) -> Mock:
        return self._is_ancient

    @property
    def trigger_for_each_header_handler(self) -> Mock:
        return self._trigger_for_each_header_handler
