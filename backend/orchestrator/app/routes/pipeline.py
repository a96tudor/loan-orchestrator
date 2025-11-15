from flask import Response, jsonify, request

from orchestrator.clients.db.wrappers.pipeline import PipelinesDBWrapper
from orchestrator.resources.pipeline.pipeline import Pipeline
from orchestrator.utils.logging import log_execution_time, logger
from orchestrator.utils.parsing import validate_pipeline_dict
from orchestrator.utils.wrappers import run_route_safely


@run_route_safely(message="Error creating pipeline", unwrap_body=True)
@log_execution_time(description="Creating a new pipeline")
def create_pipeline() -> Response:
    db_wrapper = PipelinesDBWrapper()

    pipeline_data = request.get_json(force=True)

    steps = pipeline_data.get("steps")
    if not validate_pipeline_dict(steps):
        logger.error("Invalid pipeline steps structure")
        return Response(
            response='{"error": "Invalid pipeline steps structure"}',
            status=400,
            mimetype="application/json",
        )

    pipeline_dao = db_wrapper.create_pipeline(
        name=pipeline_data["name"],
        description=pipeline_data["description"],
        steps=pipeline_data["steps"],
    )

    pipeline_dto = Pipeline.from_dao(pipeline_dao)

    return jsonify(pipeline_dto.to_dict())


@run_route_safely(message="Error fetching pipeline", unwrap_body=False)
@log_execution_time(description="Fetching pipeline by ID")
def get_pipeline_by_id(pipeline_id: str) -> Response:
    db_wrapper = PipelinesDBWrapper()

    try:
        pipeline_dao = db_wrapper.get_pipeline_by_id(pipeline_id)
    except Exception as e:
        if "not found" in str(e):
            pipeline_dao = None
        else:
            raise

    if not pipeline_dao:
        logger.error(f"Pipeline with ID {pipeline_id} not found")
        return Response(
            response='{"error": "Pipeline not found"}',
            status=404,
            mimetype="application/json",
        )

    pipeline_dto = Pipeline.from_dao(pipeline_dao)

    return jsonify(pipeline_dto.to_dict())


@run_route_safely(message="Error fetching pipelines", unwrap_body=False)
@log_execution_time(description="Fetching pipelines by parameters")
def get_pipelines() -> Response:
    status_in = request.args.getlist("statusIn")
    status_not_in = request.args.getlist("statusNotIn")

    db_wrapper = PipelinesDBWrapper()

    pipeline_daos = db_wrapper.get_pipelines_by_status(
        status_in=(
            [status for status in map(lambda s: s.upper(), status_in)]
            if status_in
            else None
        ),
        status_not_in=(
            [status for status in map(lambda s: s.upper(), status_not_in)]
            if status_not_in
            else None
        ),
    )

    pipelines = [Pipeline.from_dao(pipeline_dao) for pipeline_dao in pipeline_daos]

    return jsonify([pipeline.to_dict() for pipeline in pipelines])
