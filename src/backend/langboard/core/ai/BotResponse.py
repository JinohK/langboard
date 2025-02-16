from json import loads as json_loads
from typing import Any, AsyncGenerator
from httpx import stream


def get_langflow_output_message(response: dict) -> str | None:
    try:
        response_outputs = response["outputs"][0]
        while "messages" not in response_outputs:
            response_outputs = response_outputs["outputs"][0]
        return response_outputs["messages"][0]["message"]
    except Exception:
        return None


class LangflowStreamResponse:
    def __init__(self, stream_url: str, headers: dict, body: dict):
        self.__stream_url = stream_url
        self.__headers = headers
        self.__body = body

    async def __aiter__(self) -> AsyncGenerator[str, Any]:
        with stream("POST", self.__stream_url, json=self.__body, headers=self.__headers, timeout=60) as stream_response:
            content_type = stream_response.headers.get("content-type")
            if not content_type.count("text/event-stream"):
                return

            for chunk in stream_response.iter_lines():
                if not chunk.replace(" ", "").startswith('{"event":"token"'):
                    continue

                try:
                    json_chunk = json_loads(chunk)
                except Exception:
                    continue
                if "event" not in json_chunk or "data" not in json_chunk or "chunk" not in json_chunk["data"]:
                    continue
                yield json_chunk["data"]["chunk"]
