from asyncio import run as async_run
from inspect import iscoroutinefunction
from time import sleep
from ..BaseWorkerQueue import BaseWorkerQueue
from ..DispatcherModel import BROADCAST_DIR, load_model


class MemoryFileReaderQueue(BaseWorkerQueue):
    def start(self):
        while True:
            if not self.queue:
                sleep(0.5)
                continue

            try:
                check_string = self.queue.get_nowait()
                if check_string == "EOF":
                    self.queue.close()
                    return
            except Exception:
                pass

            for path in BROADCAST_DIR.glob("*-fileonly.json"):
                data_file_name = path.name

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
            sleep(1)
