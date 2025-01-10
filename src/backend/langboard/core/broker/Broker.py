from asyncio import run as async_run
from typing import Any, Callable, Concatenate, Coroutine, Generic, ParamSpec, Protocol, TypeVar, cast
from celery import Celery
from celery.app.task import Task
from celery.apps.worker import Worker
from celery.signals import celeryd_after_setup, setup_logging
from ...Constants import CACHE_TYPE, CACHE_URL, PROJECT_NAME
from ..logger import Logger
from ..utils.decorators import class_instance
from .TaskParameters import TaskParameters


_TParams = ParamSpec("_TParams")
_TReturn = TypeVar("_TReturn", covariant=True)


class _Task(Protocol, Generic[_TParams, _TReturn]):
    def __call__(self, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn: ...  # type: ignore


logger = Logger.use("Broker")


@setup_logging.connect
def _(*args, **kwargs):
    logger.handlers.clear()
    return logger


@celeryd_after_setup.connect
def _(sender: str, instance: Worker, **kwargs) -> None:
    instance.emit_banner = lambda: None


@class_instance()
class Broker:
    def __init__(self):
        if CACHE_TYPE == "in-memory":
            self.broker_url = "memory://"
            self.backend_url = "cache+memory://"
        else:
            self.broker_url = CACHE_URL
            self.backend_url = CACHE_URL

        self.celery = Celery(PROJECT_NAME)

        self.celery.conf.update(
            broker_url=self.broker_url,
            result_backend=self.backend_url,
            task_track_started=True,
            timezone="UTC",
        )

        self.logger = logger

    def is_in_memory(self) -> bool:
        return CACHE_TYPE == "in-memory"

    def wrap_async_task_decorator(
        self, func: Callable[Concatenate[_TParams], Coroutine[Any, Any, Any]]
    ) -> _Task[_TParams, Any]:
        """Wrap async celery task decorator.

        You don't need to use `@Broker.celery.task` decorator.

        DO NOT use *args or **kwargs in async task.
        """

        def task(*args: _TParams.args, **kwargs: _TParams.kwargs) -> Any:
            new_args, new_kwargs = self.__unpack_task_parameters(func, *args, **kwargs)
            return async_run(func(*new_args, **new_kwargs))

        return self.__run_async_task(cast(Any, self.celery.task(task)))

    def wrap_sync_task_decorator(self, func: Callable[Concatenate[_TParams], Any]) -> _Task[_TParams, Any]:
        """Wrap sync celery task decorator.

        You don't need to use `@Broker.celery.task` decorator.

        DO NOT use *args or **kwargs in sync task.
        """

        def task(*args: _TParams.args, **kwargs: _TParams.kwargs) -> Any:
            new_args, new_kwargs = self.__unpack_task_parameters(func, *args, **kwargs)
            return func(*new_args, **new_kwargs)

        return self.__run_sync_task(cast(Any, self.celery.task(task)))

    def start(self, argv: list[str] | None = None):
        if argv is None:
            argv = ["worker", "--loglevel=info", "--pool=solo"]

        try:
            if self.is_in_memory():
                self.logger.info("Broker started with in-memory cache.")
            else:
                self.logger.info("Broker started with cache: %s", CACHE_URL)
            self.celery.worker_main(argv)
        except Exception:
            self.celery.close()

    def __run_async_task(self, func: Callable[Concatenate[_TParams], Any]) -> _Task[_TParams, Any]:
        def inner(*args: _TParams.args, **kwargs: _TParams.kwargs) -> Any:
            new_args, new_kwargs = self.__pack_task_parameters(*args, **kwargs)
            return cast(Task, func).apply_async(args=new_args, kwargs=new_kwargs)

        return inner

    def __run_sync_task(self, func: Callable[Concatenate[_TParams], Any]) -> _Task[_TParams, Any]:
        def inner(*args: _TParams.args, **kwargs: _TParams.kwargs) -> Any:
            new_args, new_kwargs = self.__pack_task_parameters(*args, **kwargs)
            return cast(Task, func).apply(args=new_args, kwargs=new_kwargs)

        return inner

    def __pack_task_parameters(self, *args: Any, **kwargs: Any):
        task_parameters = TaskParameters(*args, **kwargs)
        return task_parameters.pack()

    def __unpack_task_parameters(self, func: Callable, *args: Any, **kwargs: Any):
        task_parameters = TaskParameters(*args, **kwargs)
        return task_parameters.unpack(func)
