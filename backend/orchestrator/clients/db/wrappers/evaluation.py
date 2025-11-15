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
        pipeline_version_id: str,
    ) -> ApplicationEvaluation:
        """Create a new application evaluation entry."""
        new_evaluation = self._create_and_upsert(
            application_id=application_id,
            pipeline_id=pipeline_id,
            pipeline_version_id=pipeline_version_id,
            status=ApplicationEvaluationStatus.PENDING,
        )
        return new_evaluation
