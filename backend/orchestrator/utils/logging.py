import queue
import threading
from dataclasses import dataclass
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, List, Optional

from pyutils.helpers.execution_info import get_execution_id
from pyutils.logging import Logger, get_logger
from pyutils.logging.formatters import JSONLogFormatter
from pyutils.logging.handlers import CommandLineHandler

from orchestrator.utils.formatting import current_utc, format_rfc3339


@dataclass
class _LoggingJob:
    args: Optional[List[Any]]
    kwargs: Optional[Dict[str, Any]]
    func: Callable

    def execute(self):
        args = self.args or []
        kwargs = self.kwargs or {}

        self.func(*args, **kwargs)


class AsyncLogger:
    __SECRET_PATH = ["tonight", "betterstack", "secrets"]
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        """Singleton pattern to ensure only one logger instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, "_initialized"):
            return

        self._initialized = True

        self.__handler = None
        self.__formatter = JSONLogFormatter()
        self.__logger: Optional[Logger] = None

        self.__log_queue = queue.Queue(maxsize=10000)

        self.__setup_logger()

        self._worker_thread = None
        self._shutdown_event = threading.Event()

        # Start the worker thread automatically on logger creation
        self.start()

    def start(self):
        """Start the background worker thread."""
        if self._worker_thread is None or not self._worker_thread.is_alive():
            self._shutdown_event.clear()
            self._worker_thread = threading.Thread(
                target=self.__worker_loop, name="Logger", daemon=True
            )
            self._worker_thread.start()
            self.info("Threaded logger started")

    def stop(self, timeout: float = 30.0):
        """
        Stop the background worker thread gracefully.

        Args:
            timeout: Maximum time to wait for the thread to stop
        """
        if self._worker_thread and self._worker_thread.is_alive():
            self.info("Stopping GraphQL threaded logger...")
            self._shutdown_event.set()

            # Add a sentinel value to wake up the worker
            try:
                self.__log_queue.put_nowait(None)
            except queue.Full:
                pass

            self._worker_thread.join(timeout=timeout)

    def __worker_loop(self):
        while not self._shutdown_event.is_set():
            try:
                job = self.__log_queue.get(timeout=1)
                if job is None:
                    break
                job.execute()
                self.__log_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                if self.__logger:
                    self.__logger.error(f"Error processing log job: {e}")

    def __setup_logger(self):
        self.__handler = CommandLineHandler()
        self.__logger = get_logger(
            __name__, formatter=self.__formatter, handler=self.__handler, level="DEBUG"
        )

    def __add_job(
        self,
        func: Callable,
        args: Optional[List[Any]] = None,
        kwargs: Optional[Dict[str, Any]] = None,
    ):
        if kwargs is None:
            kwargs = {}
        if "extra" in kwargs:
            kwargs["extra"]["execution_id"] = get_execution_id()
        else:
            kwargs["extra"] = {"execution_id": get_execution_id()}
        job = _LoggingJob(args=args, kwargs=kwargs, func=func)
        try:
            self.__log_queue.put_nowait(job)
        except queue.Full:
            if self.__logger:
                self.__logger.warning("Log queue is full. Dropping log message.")

    def info(self, msg: str, *args, **kwargs):
        if self.__logger:
            self.__add_job(self.__logger.info, [msg] + list(args), kwargs)

    def debug(self, msg: str, *args, **kwargs):
        if self.__logger:
            self.__add_job(self.__logger.debug, [msg] + list(args), kwargs)

    def warning(self, msg: str, *args, **kwargs):
        if self.__logger:
            self.__add_job(self.__logger.warning, [msg] + list(args), kwargs)

    def error(self, msg: str, *args, **kwargs):
        if self.__logger:
            self.__add_job(self.__logger.error, [msg] + list(args), kwargs)

    def exception(self, msg: str, *args, **kwargs):
        if self.__logger:
            self.__add_job(self.__logger.exception, [msg] + list(args), kwargs)

    # Optionally, expose a flush method to drain the queue (for testing or shutdown)
    def flush(self, timeout: float = 5.0):
        """Flush all log jobs in the queue."""
        end_time = datetime.utcnow().timestamp() + timeout
        while not self.__log_queue.empty() and datetime.utcnow().timestamp() < end_time:
            try:
                job = self.__log_queue.get_nowait()
                if job is None:
                    continue
                job.execute()
                self.__log_queue.task_done()
            except queue.Empty:
                break


logger = AsyncLogger()


def log_duration(description: str, start_time: datetime, end_time: datetime) -> None:
    duration = end_time - start_time
    start_time = format_rfc3339(start_time, microseconds=True)
    end_time = format_rfc3339(end_time, microseconds=True)

    logger.debug(
        f"duration: {duration}, start: {start_time}, end: {end_time}: {description}"
    )


def log_execution_time(description: str) -> Callable:
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args, **kwargs) -> Any:
            start_time = current_utc()
            result = f(*args, **kwargs)
            end_time = current_utc()
            log_duration(description, start_time, end_time)
            return result

        return wrapper

    return decorator


def flush_logs():
    try:
        logger.flush()
    except Exception:
        pass
