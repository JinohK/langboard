from .App import App
from .core.broadcast import ensure_initialized


ensure_initialized()


def create_app():
    app = App()
    return app.create()


app = create_app()
