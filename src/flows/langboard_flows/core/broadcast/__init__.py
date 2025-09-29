from core.broadcast import DispatcherQueue
from ...Constants import DATA_DIR


BROADCAST_DIR = DATA_DIR / "broadcast"
BROADCAST_DIR.mkdir(parents=True, exist_ok=True)


DispatcherQueue.set_broadcast_dir(BROADCAST_DIR)


def ensure_initialized():
    pass
