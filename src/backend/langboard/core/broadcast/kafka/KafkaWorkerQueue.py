import json
from asyncio import run as async_run
from inspect import iscoroutinefunction
from kafka import KafkaConsumer
from ....Constants import BROADCAST_URLS
from ..BaseWorkerQueue import BaseWorkerQueue
from ..DispatcherModel import load_model


class KafkaWorkerQueue(BaseWorkerQueue):
    def start(self):
        consumer = KafkaConsumer(
            bootstrap_servers=BROADCAST_URLS,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="latest",
            enable_auto_commit=True,
        )

        consumer.subscribe(topics=self.get_consumer_names())

        for message in consumer:
            try:
                consumed_string = message.value.get("file", "")
                if not consumed_string or not isinstance(consumed_string, str):
                    continue

                model = load_model(consumed_string, should_delete=False)
                if not model:
                    raise ValueError("")

                consumer_func = self.get_consumer(model.event)
                if not consumer_func:
                    raise NameError("")

                if iscoroutinefunction(consumer_func):
                    async_run(consumer_func(model.data))
                else:
                    consumer_func(model.data)
            except Exception:
                continue
