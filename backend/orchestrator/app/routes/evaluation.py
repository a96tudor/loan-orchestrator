from flask import Response, request

from orchestrator.app.routes.application import get_application_dao_by_key
from orchestrator.app.routes.pipeline import get_pipeline_dao_by_id
from orchestrator.utils.logging import log_execution_time, logger
from orchestrator.utils.wrappers import run_route_safely


@run_route_safely(message="Error evaluating application", unwrap_body=True)
@log_execution_time(description="Evaluating loan application")
def evaluate_application() -> Response:
    evaluation_request = request.get_json(force=True)

    application_key = evaluation_request["applicationKey"]
    pipeline_id = evaluation_request.get("pipelineId")

    application_dao = get_application_dao_by_key(application_key)
    if application_dao is None:
        logger.error(f"Application with key {application_key} not found")
        return Response(
            response='{"error": "Application not found"}',
            status=400,
            mimetype="application/json",
        )

    pipeline_dao = get_pipeline_dao_by_id(pipeline_id)
    if pipeline_dao is None:
        logger.error(f"Pipeline with ID {pipeline_id} not found")
        return Response(
            response='{"error": "Pipeline not found"}',
            status=400,
            mimetype="application/json",
        )

    # TODO: Implement the actual evaluation logic here

    # return jsonify({"evaluationResult": evaluation_result.value})
