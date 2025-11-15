from typing import List, Optional
from uuid import uuid4

from pyutils.database.sqlalchemy.filters import EqualityFilter, InListFilter
from pyutils.database.sqlalchemy.joins import Join

from orchestrator.clients.db.schema import Application, ApplicationEvaluation
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

    @log_execution_time("Retrieving evaluations by values")
    def get_evaluations_by_values(
        self,
        application_key: Optional[str] = None,
        pipeline_id: Optional[str] = None,
        status_in: Optional[List[ApplicationEvaluationStatus]] = None,
        status_not_in: Optional[List[ApplicationEvaluationStatus]] = None,
        limit: Optional[int] = None,
    ) -> List[ApplicationEvaluation]:
        filters = []
        joins = []

        if application_key:
            filters.append(EqualityFilter(Application.key, application_key))
            joins.append(
                Join(
                    Application,
                    ApplicationEvaluation.application_id,
                    Application.id,
                )
            )

        if pipeline_id:
            filters.append(
                EqualityFilter(ApplicationEvaluation.pipeline_id, pipeline_id)
            )

        if status_in:
            filters.append(InListFilter(ApplicationEvaluation.status, status_in))
        if status_not_in:
            filters.append(
                InListFilter(ApplicationEvaluation.status, status_not_in, negated=True)
            )

        order_by = None
        order_by = {
            "field": "created_at",
            "direction": "desc",
        }

        return self._get_model(
            filters=filters,
            joins=joins,
            order_by=order_by,
            limit=limit,
            return_type=self.GetResultType.ALL,
        )
