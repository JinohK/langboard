from time import sleep
from ...utils.DateTime import now
from ..BaseWorkerQueue import BaseWorkerQueue
from ..DispatcherModel import BROADCAST_DIR


TTL_SECONDS = 300  # 5분


class KafkaFileReaderQueue(BaseWorkerQueue):
    def start(self):
        while True:
            for path in BROADCAST_DIR.glob("*.json"):
                try:
                    timestamp = path.stat().st_mtime
                    diff = int(now().timestamp() - timestamp)
                    if diff >= TTL_SECONDS:
                        path.unlink(missing_ok=True)
                        continue
                except Exception:
                    continue

            sleep(60)
