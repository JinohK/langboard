from starlette.datastructures import Headers
from starlette.types import ASGIApp, Scope, Send, Receive, Message
from gzip import decompress


class GZipDecompressMiddleware:
    """Decompresses the request body if it is compressed with GZip."""

    def __init__(
        self,
        app: ASGIApp,
    ) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)

        async def wrapped_receive() -> Message:
            message = await receive()
            if message["type"] == "http.disconnect":
                return message

            body = message.get("body", b"")
            if "gzip" in headers.getlist("content-encoding"):
                body = decompress(body)
                message["body"] = body
            return message

        await self.app(scope, wrapped_receive, send)
