from time import time
from typing import Optional

from orchestrator.clients.db.schema import Pipeline as PipelineDAO
from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.step import PipelineStep
from orchestrator.resources.types import EvaluationResult, PipelineStatus
from orchestrator.utils.parsing import parse_pipeline_step


class Pipeline:
    def __init__(
        self,
        id_: str,
        name: str,
        description: str,
        version: str,
        status: PipelineStatus,
        root_step: PipelineStep,
    ):
        self.id_ = id_
        self.name = name
        self.description = description
        self.version = version
        self.status = status
        self.root_step = root_step

        self.run_result: Optional[EvaluationResult] = None
        self.run_time: float = 0.0

    def run_on_application(self, application: Application) -> EvaluationResult:
        start_time = time()
        self.run_result = self.root_step.execute(application)
        end_time = time()
        self.run_time = end_time - start_time

        return self.run_result

    def to_dict(self) -> dict:
        return {
            "id": self.id_,
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "status": self.status.value,
            "steps": self.root_step.to_dict(),
        }

    @property
    def run_log(self) -> Optional[dict]:
        if self.run_result is None:
            return None

        return {
            "pipeline": {
                "name": self.name,
                "version": self.version,
                "description": self.description,
            },
            "steps": self.root_step.to_dict(),
            "eval": self.root_step.get_evaluation_result(),
            "run_result": self.run_result,
            "run_duration": self.run_time,
        }

    @classmethod
    def from_dao(cls, dao: PipelineDAO) -> "Pipeline":
        root_step = parse_pipeline_step(dao.current_version.steps)
        return cls(
            id_=dao.id,
            name=dao.name,
            description=dao.description,
            version=str(dao.current_version.version_number),
            status=PipelineStatus(dao.status),
            root_step=root_step,
        )
