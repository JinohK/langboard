from asyncio import run as async_run
from inspect import iscoroutinefunction
from time import sleep
from ..BaseWorkerQueue import BaseWorkerQueue
from ..DispatcherModel import load_model


class MemoryWorkerQueue(BaseWorkerQueue):
    def start(self):
        while True:
            if not self.queue:
                sleep(0.5)
                continue

            try:
                data_file_name: str = self.queue.get()
                if not isinstance(data_file_name, str):
                    raise TypeError
            except Exception:
                continue

            if data_file_name == "EOF":
                self.queue.close()
                break

            try:
                model = load_model(data_file_name, should_delete=True)
                if not model:
                    raise ValueError("")

                consumer = self.get_consumer(model.event)
                if not consumer:
                    raise NameError("")

                if iscoroutinefunction(consumer):
                    async_run(consumer(model.data))
                else:
                    consumer(model.data)
            except Exception:
                continue
