from multiprocessing import Queue
from ...Constants import BROADCAST_TYPE
from ..utils.decorators import class_instance, thread_safe_singleton


@class_instance()
@thread_safe_singleton
class WorkerQueue:
    def __init__(self):
        if BROADCAST_TYPE == "in-memory":
            from .memory import MemoryWorkerQueue

            self.__instance = MemoryWorkerQueue()
        elif BROADCAST_TYPE == "kafka":
            from .kafka import KafkaWorkerQueue

            self.__instance = KafkaWorkerQueue()
        else:
            raise ValueError(f"Unsupported BROADCAST_TYPE: {BROADCAST_TYPE}")

    def set_queue(self, queue: Queue):
        self.__instance.queue = queue

    def start(self):
        self.__instance.start()

    def consume(self, event: str):
        return self.__instance.consume(event)
