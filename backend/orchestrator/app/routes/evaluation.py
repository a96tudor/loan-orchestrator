from flask import Response, jsonify, request

from orchestrator.app.routes.application import get_application_dao_by_key
from orchestrator.app.routes.pipeline import get_pipeline_dao_by_id
from orchestrator.clients.db.wrappers.application import ApplicationsDBWrapper
from orchestrator.clients.db.wrappers.evaluation import EvaluationsDBWrapper
from orchestrator.resources.evaluation import Evaluation as EvaluationDTO
from orchestrator.resources.types import (
    ApplicationEvaluationStatus,
    ApplicationStatus,
    EvaluationResult,
)
from orchestrator.utils.async_evaluator import async_evaluator
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
        async_evaluator.add_to_queue(evaluation_dto)
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


@run_route_safely(message="Error getting evaluation by ID", unwrap_body=False)
@log_execution_time(description="Getting evaluations by parameters")
def get_evaluations_by_params() -> Response:
    application_key = request.args.get("applicationKey")
    pipeline_id = request.args.get("pipelineId")
    status_in = request.args.getlist("statusIn")
    status_not_in = request.args.getlist("statusNotIn")

    db_wrapper = EvaluationsDBWrapper()
    evaluations_dao = db_wrapper.get_evaluations_by_values(
        application_key=application_key,
        pipeline_id=pipeline_id,
        status_in=status_in,
        status_not_in=status_not_in,
    )

    evaluations_dto = [
        EvaluationDTO.from_dao(evaluation_dao) for evaluation_dao in evaluations_dao
    ]
    evaluations_dict = [evaluation_dto.to_dict() for evaluation_dto in evaluations_dto]

    return jsonify(evaluations_dict)


@run_route_safely(message="Error retrieving evaluation statistics", unwrap_body=False)
@log_execution_time(description="Retrieving evaluation statistics")
def get_evaluation_stats() -> Response:
    db_wrapper = EvaluationsDBWrapper()
    evaluations = db_wrapper.get_evaluations_by_values()

    count_by_status = {
        status.value: len([e for e in evaluations if e.status == status])
        for status in ApplicationEvaluationStatus
    }

    count_by_result = {
        result.value: len([e for e in evaluations if e.result == result])
        for result in EvaluationResult
    }

    all_durations = [e.details["run_duration"] for e in evaluations if e.details]

    average_duration = sum(all_durations) / len(all_durations) if all_durations else 0.0

    return jsonify(
        {
            "byStatus": count_by_status,
            "byResult": count_by_result,
            "averageDuration": average_duration,
        }
    )
