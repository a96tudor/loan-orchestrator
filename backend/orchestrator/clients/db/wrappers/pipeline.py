from typing import Optional

from orchestrator.clients.db.schema import Pipeline, PipelineVersion
from orchestrator.clients.db.wrappers.base import BaseDBWrapper
from orchestrator.utils.logging import log_execution_time


class PipelinesDBWrapper(BaseDBWrapper):
    def __init__(self):
        super().__init__(Pipeline)

    @log_execution_time("Fetching pipeline by ID")
    def get_pipeline_by_id(self, pipeline_id: str) -> Optional[Pipeline]:
        return self._get_model_by_id(pipeline_id)

    @log_execution_time("Creating a new pipeline")
    def create_pipeline(
        self,
        name: str,
        description: str,
        steps: dict,
    ) -> Pipeline:
        # Creating the version first
        pipeline_version = self._create_and_upsert_model(
            model_class=PipelineVersion,
            version=1,
            steps=steps,
        )

        # Then creating the pipeline itself
        new_pipeline = self._create_and_upsert(
            name=name,
            description=description,
            current_version_id=pipeline_version.id,
        )

        return new_pipeline
