from flask import Response, jsonify, request

from orchestrator.app.routes.application import get_application_dao_by_key
from orchestrator.app.routes.pipeline import get_pipeline_dao_by_id
from orchestrator.clients.db.wrappers.application import ApplicationsDBWrapper
from orchestrator.clients.db.wrappers.evaluation import EvaluationsDBWrapper
from orchestrator.resources.evaluation import Evaluation as EvaluationDTO
from orchestrator.resources.types import ApplicationStatus
from orchestrator.utils.logging import log_execution_time, logger
from orchestrator.utils.wrappers import run_route_safely


@run_route_safely(message="Error evaluating application", unwrap_body=True)
@log_execution_time(description="Creating loan application evaluation")
def evaluate_application() -> Response:
    evaluation_request = request.get_json(force=True)

    application_key = evaluation_request["applicationKey"]
    pipeline_id = evaluation_request["pipelineId"]

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

    db_wrapper = EvaluationsDBWrapper()

    evaluation_dao = None

    try:
        evaluation_dao = db_wrapper.create_evaluation(
            application_id=application_dao.id,
            pipeline_id=pipeline_dao.id,
        )
        evaluation_dto = EvaluationDTO.from_dao(evaluation_dao)
    except Exception as err:
        logger.error(
            f"Failed to create evaluation for application {application_dao.id} "
            f"and pipeline {pipeline_dao.id}: {err}"
        )

        if application_dao:
            db_wrapper.delete_evaluation(evaluation_dao)

        return Response(
            response='{"error": "Failed to create evaluation"}',
            status=500,
            mimetype="application/json",
        )

    try:
        ApplicationsDBWrapper().update_application_status(
            application=application_dao,
            new_status=ApplicationStatus.IN_REVIEW,
        )
    except Exception as err:
        logger.error(
            f"Failed to update status for application {application_dao.id} "
            f"to IN_REVIEW: {err}"
        )
        pass

    return jsonify(evaluation_dto.to_dict())


@run_route_safely(message="Error getting evaluation by ID", unwrap_body=False)
@log_execution_time(description="Getting evaluation by ID")
def get_evaluation_by_id(evaluation_id: str) -> Response:
    db_wrapper = EvaluationsDBWrapper()
    evaluation_dao = db_wrapper.get_evaluation_by_id(evaluation_id)

    if evaluation_dao is None:
        logger.error(f"Evaluation with ID {evaluation_id} not found")
        return Response(
            response='{"error": "Evaluation not found"}',
            status=404,
            mimetype="application/json",
        )

    evaluation_dto = EvaluationDTO.from_dao(evaluation_dao)
    return jsonify(evaluation_dto.to_dict())
