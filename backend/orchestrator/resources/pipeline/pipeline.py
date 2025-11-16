from datetime import datetime
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
        react_flow_nodes: dict,
        created_at: datetime,
        updated_at: datetime,
    ):
        self.id_ = id_
        self.name = name
        self.description = description
        self.version = version
        self.status = status
        self.root_step = root_step
        self.react_flow_nodes = react_flow_nodes
        self.created_at = created_at
        self.updated_at = updated_at

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
            "reactFlowNodes": self.react_flow_nodes,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
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
            "run_result": self.run_result.value,
            "run_duration": self.run_time,
        }

    @classmethod
    def from_dao(cls, dao: PipelineDAO) -> "Pipeline":
        root_step = parse_pipeline_step(dao.current_version.steps)
        return cls(
            id_=str(dao.id),
            name=dao.name,
            description=dao.description,
            version=str(dao.current_version.version_number),
            status=PipelineStatus(dao.status),
            root_step=root_step,
            react_flow_nodes=dao.current_version.react_flow_nodes or {},
            created_at=dao.created_at,
            updated_at=dao.updated_at,
        )
