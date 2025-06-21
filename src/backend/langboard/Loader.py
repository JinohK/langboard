from core.ModuleLoader import ModuleLoader as _ModuleLoader
from .Constants import BASE_DIR
from .core.logger import Logger


ModuleLoader = _ModuleLoader(BASE_DIR, Logger, __name__)
