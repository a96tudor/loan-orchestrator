from uuid import uuid4

from orchestrator.clients.db.schema import ApplicationEvaluation
from orchestrator.clients.db.wrappers.base import BaseDBWrapper
from orchestrator.resources.types import ApplicationEvaluationStatus
from orchestrator.utils.logging import log_execution_time


class EvaluationsDBWrapper(BaseDBWrapper):
    def __init__(self):
        super().__init__(ApplicationEvaluation)

    @log_execution_time(description="Creating a new application evaluation")
    def create_evaluation(
        self,
        application_id: str,
        pipeline_id: str,
    ) -> ApplicationEvaluation:
        """Create a new application evaluation entry."""
        new_evaluation = self._create_and_upsert(
            id=str(uuid4()),
            application_id=application_id,
            pipeline_id=pipeline_id,
            status=ApplicationEvaluationStatus.PENDING,
        )

        return new_evaluation

    @log_execution_time("Deleting an application evaluation")
    def delete_evaluation(self, evaluation: ApplicationEvaluation) -> None:
        """Delete an application evaluation entry."""
        self._delete_model(evaluation)

    @log_execution_time("Retrieving evaluation by ID")
    def get_evaluation_by_id(self, evaluation_id: str) -> ApplicationEvaluation:
        return self._get_model_by_id(evaluation_id)
