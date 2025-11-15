from typing import Optional

from orchestrator.clients.db.schema import (
    ApplicationEvaluation as ApplicationEvaluationDAO,
)
from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.pipeline import Pipeline
from orchestrator.resources.types import ApplicationEvaluationStatus, EvaluationResult


class Evaluation:
    def __init__(
        self,
        id_: str,
        application: Application,
        pipeline: Pipeline,
        status: ApplicationEvaluationStatus,
        result: Optional[EvaluationResult] = None,
        details: Optional[dict] = None,
    ):
        self.id_ = id_
        self.application = application
        self.pipeline = pipeline
        self.status = status
        self.result = result
        self.details = details

    @classmethod
    def from_dao(cls, dao: ApplicationEvaluationDAO) -> "Evaluation":
        application = Application.from_dao(dao.application)
        pipeline = Pipeline.from_dao(dao.pipeline_version)
        return cls(
            id_=dao.id,
            application=application,
            pipeline=pipeline,
            status=dao.status,
            result=dao.result,
            details=dao.details,
        )

    def to_dict(self) -> dict:
        return {
            "evaluationId": self.id_,
            "application": self.application.to_dict(),
            "pipeline": self.pipeline.to_dict(),
            "status": self.status.value,
            "result": self.result.value if self.result else None,
            "details": self.details,
        }
