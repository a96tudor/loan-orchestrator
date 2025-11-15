import queue
import threading
from dataclasses import dataclass
from datetime import datetime, timezone

from orchestrator.clients.db.schema import ApplicationEvaluation as EvaluationDAO
from orchestrator.clients.db.wrappers.application import ApplicationsDBWrapper
from orchestrator.clients.db.wrappers.evaluation import EvaluationsDBWrapper
from orchestrator.resources.evaluation import Evaluation
from orchestrator.resources.types import ApplicationEvaluationStatus, ApplicationStatus
from orchestrator.utils.logging import logger


@dataclass
class AsyncEvaluatorJob:
    evaluation: Evaluation

    _evaluation_db_wrapper: EvaluationsDBWrapper = EvaluationsDBWrapper()
    _application_db_wrapper: ApplicationsDBWrapper = ApplicationsDBWrapper()

    def __attempt_execution(self, evaluation_dao: EvaluationDAO):
        self.evaluation.run()

        self._evaluation_db_wrapper.update_evaluation(
            evaluation_dao,
            status=ApplicationEvaluationStatus.EVALUATED,
            result=self.evaluation.result,
            details=self.evaluation.details,
        )
        self._application_db_wrapper.update_application_status(
            evaluation_dao.application,
            ApplicationStatus.REVIEWED,
        )

    def __handle_evaluation_failure(
        self, evaluation_dao: EvaluationDAO, error: Exception
    ):
        logger.error(f"Evaluation {self.evaluation.id_} failed with error: {error}")
        self._evaluation_db_wrapper.update_evaluation(
            evaluation_dao,
            status=ApplicationEvaluationStatus.EVALUATING_ERROR,
            result=None,
            details={"error": str(error)},
        )
        self._application_db_wrapper.update_application_status(
            evaluation_dao.application,
            ApplicationStatus.REVIEWING_ERROR,
        )

    def execute(self):
        # Set status to EVALUATING

        evaluation_dao = self._evaluation_db_wrapper.get_evaluation_by_id(
            self.evaluation.id_
        )
        self.evaluation.status = ApplicationEvaluationStatus.EVALUATING
        self._evaluation_db_wrapper.update_evaluation(
            evaluation_dao, status=ApplicationEvaluationStatus.EVALUATING
        )

        try:
            self.__attempt_execution(evaluation_dao=evaluation_dao)
        except Exception as err:
            self.__handle_evaluation_failure(evaluation_dao, err)


class AsyncEvaluator:
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
        self.name = "AsyncEvaluator"
        self._initialized = True

        self.__queue = queue.Queue(maxsize=10000)

        self._worker_thread = None
        self._shutdown_event = threading.Event()

        # Start the worker thread automatically on logger creation
        self.start()

    def start(self):
        """Start the background worker thread."""
        if self._worker_thread is None or not self._worker_thread.is_alive():
            self._shutdown_event.clear()
            self._worker_thread = threading.Thread(
                target=self.__worker_loop, name=self.name, daemon=True
            )
            self._worker_thread.start()
            logger.info("Threaded logger started")

    def stop(self, timeout: float = 30.0):
        """
        Stop the background worker thread gracefully.

        Args:
            timeout: Maximum time to wait for the thread to stop
        """
        if self._worker_thread and self._worker_thread.is_alive():
            logger.info("Stopping GraphQL threaded logger...")
            self._shutdown_event.set()

            # Add a sentinel value to wake up the worker
            try:
                self.__queue.put_nowait(None)
            except queue.Full:
                pass

            self._worker_thread.join(timeout=timeout)

    def add_to_queue(self, evaluation: Evaluation):
        try:
            self.__queue.put_nowait(AsyncEvaluatorJob(evaluation))
        except queue.Full:
            logger.warning("Job queue is full, dropping job")

    def flush(self, timeout: float = 5.0):
        """Flush all log jobs in the queue."""
        end_time = datetime.now(tz=timezone.utc).timestamp() + timeout
        while not self.__queue.empty() and datetime.utcnow().timestamp() < end_time:
            try:
                job = self.__queue.get_nowait()
                if job is None:
                    continue
                job.execute()
                self.__queue.task_done()
            except queue.Empty:
                break

    def __worker_loop(self):
        while not self._shutdown_event.is_set():
            try:
                job = self.__queue.get(timeout=1)
                if job is None:
                    break
                job.execute()
                self.__queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error processing log job: {e}")


async_evaluator = AsyncEvaluator()
