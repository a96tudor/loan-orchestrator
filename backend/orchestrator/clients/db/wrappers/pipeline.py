from typing import Optional
from uuid import uuid4

from pyutils.database.sqlalchemy.filters import InListFilter

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
        pipeline_version_id = str(uuid4())
        pipeline_version = self._create_and_upsert_model(
            model_class=PipelineVersion,
            id=pipeline_version_id,
            version_number=1,
            steps=steps,
        )

        pipeline_id = str(uuid4())
        # Then creating the pipeline itself
        new_pipeline = self._create_and_upsert(
            id=pipeline_id,
            name=name,
            description=description,
            current_version_id=pipeline_version_id,
        )

        return new_pipeline

    def get_pipelines_by_status(
        self,
        status_in: Optional[list[str]] = None,
        status_not_in: Optional[list[str]] = None,
    ) -> list[Pipeline]:
        filters = []

        if status_in:
            filters.append(InListFilter(self.model_class.status, status_in))

        if status_not_in:
            filters.append(
                InListFilter(self.model_class.status, status_not_in, negated=True)
            )

        return self._get_with_filters(
            model_class=self.model_class,
            filters=filters,
            return_type=self.GetResultType.ALL,
        )
