from json import loads as json_loads
from typing import Any, AsyncGenerator
from httpx import stream
from langchain_core.runnables import Runnable
from langchain_core.runnables.utils import Input
from pydantic import BaseModel


def get_langchain_output_message(output: dict) -> str | None:
    if hasattr(output, "response"):
        return output.response  # type: ignore
    elif "response" in output:
        return output["response"]
    else:
        return None


def get_langflow_output_message(response: dict) -> str | None:
    try:
        return response["outputs"][0]["messages"][0]["message"]
    except Exception:
        return None


class LangchainOutput(BaseModel):
    response: str


class LangchainStreamResponse:
    def __init__(self, runnable: Runnable[Input, LangchainOutput], input: Input):
        self.__runnable = runnable
        self.__input = input

    async def __aiter__(self) -> AsyncGenerator[str, Any]:
        async for output in self.__runnable.astream(self.__input):
            response = get_langchain_output_message(output)  # type: ignore
            if response is not None:
                yield response
            else:
                continue


class LangflowStreamResponse:
    def __init__(self, stream_url: str, params: dict):
        self.__stream_url = stream_url
        self.__params = params

    async def __aiter__(self) -> AsyncGenerator[str, Any]:
        with stream("GET", self.__stream_url, params=self.__params, timeout=None) as stream_response:
            should_yield = False
            for chunk in stream_response.iter_lines():
                if chunk.count("event: message"):
                    should_yield = True
                    continue

                if not should_yield:
                    continue

                if chunk.startswith("data: "):
                    chunk = chunk[6:]
                should_yield = False
                result = json_loads(chunk)
                if "chunk" not in result:
                    continue
                yield result["chunk"]
