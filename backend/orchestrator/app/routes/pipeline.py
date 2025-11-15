from flask import Response, jsonify, request

from orchestrator.clients.db.wrappers.pipeline import PipelinesDBWrapper
from orchestrator.utils.logging import log_execution_time, logger
from orchestrator.utils.wrappers import run_route_safely


@run_route_safely(message="Error creating pipeline", unwrap_body=True)
@log_execution_time(description="Creating a new pipeline")
def create_pipeline() -> Response:
    db_wrapper = PipelinesDBWrapper()

    pipeline_data = request.get_json(force=True)
    new_pipeline = db_wrapper.create_pipeline(
        name=pipeline_data["name"],
        description=pipeline_data["description"],
        steps=pipeline_data["steps"],
    )
