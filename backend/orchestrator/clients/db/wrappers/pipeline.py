from typing import Optional
from uuid import uuid4

from pyutils.database.sqlalchemy.filters import InListFilter

from orchestrator.clients.db.schema import Pipeline, PipelineVersion
from orchestrator.clients.db.wrappers.base import BaseDBWrapper
from orchestrator.resources.types import PipelineStatus
from orchestrator.utils.logging import log_execution_time


class PipelinesDBWrapper(BaseDBWrapper):
    def __init__(self):
        super().__init__(Pipeline)

    @log_execution_time("Fetching pipeline by ID")
    def get_pipeline_by_id(self, pipeline_id: str) -> Optional[Pipeline]:
        return self._get_model_by_id(pipeline_id)

    def _create_pipeline_version(
        self,
        version_number: int,
        steps: dict,
        previous_version_id: Optional[str] = None,
    ) -> PipelineVersion:
        pipeline_version_id = str(uuid4())
        pipeline_version = self._create_and_upsert_model(
            model_class=PipelineVersion,
            id=pipeline_version_id,
            version_number=version_number,
            steps=steps,
        )
        return pipeline_version

    @log_execution_time("Creating a new pipeline")
    def create_pipeline(
        self,
        name: str,
        description: str,
        steps: dict,
    ) -> Pipeline:
        # Creating the version first
        pipeline_version = self._create_pipeline_version(
            version_number=1,
            steps=steps,
        )

        pipeline_id = str(uuid4())
        # Then creating the pipeline itself
        new_pipeline = self._create_and_upsert(
            id=pipeline_id,
            name=name,
            description=description,
            current_version_id=pipeline_version.id,
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

    def __should_update(self, pipeline: Pipeline, **kwargs) -> bool:
        if all(value is None for value in kwargs.values()):
            return False

        if pipeline.current_version.steps == kwargs.get("steps"):
            return False
        if pipeline.name == kwargs.get("name"):
            return False
        if pipeline.description == kwargs.get("description"):
            return False
        if pipeline.status == kwargs.get("status"):
            return False

        return True

    def update_pipeline(
        self,
        pipeline: Pipeline,
        name: Optional[str] = None,
        description: Optional[str] = None,
        steps: Optional[dict] = None,
        status: Optional[PipelineStatus] = None,
    ) -> Pipeline:
        should_update = self.__should_update(
            pipeline,
            name=name,
            description=description,
            steps=steps,
            status=status,
        )
        if not should_update:
            return pipeline

        if steps is not None:
            # We need to create a new version
            version = pipeline.current_version.version_number + 1
            new_version = self._create_pipeline_version(
                version_number=version,
                steps=steps,
                previous_version_id=pipeline.current_version.id,
            )
            pipeline.current_version_id = new_version.id
            pipeline.current_version = new_version

        if name is not None:
            pipeline.name = name
        if description is not None:
            pipeline.description = description
        if status is not None:
            pipeline.status = status

        return self._upsert_model(pipeline)
