import sys
from pathlib import Path


root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root / "shared"))
sys.path.insert(0, str(root / "shared/core"))
sys.path.insert(0, str(root / "shared/models"))


def ensure():
    pass
