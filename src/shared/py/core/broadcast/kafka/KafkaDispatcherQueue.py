import json
from typing import Any
from kafka import KafkaProducer
from ...Env import Env
from ..BaseDispatcherQueue import BaseDispatcherQueue
from ..DispatcherModel import DispatcherModel


class KafkaDispatcherQueue(BaseDispatcherQueue):
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=Env.BROADCAST_URLS, value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )

    async def put(self, event: str | DispatcherModel, data: dict[str, Any] | None = None):
        cache_key = await self._record_model(event, data)
        self.producer.send(event if isinstance(event, str) else event.event, {"cache_key": cache_key})
        self.producer.flush()

    def start(self):
        self.is_closed = False

    def close(self):
        self.is_closed = True
        self.producer.close()
