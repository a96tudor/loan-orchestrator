import json

from flask import Response, jsonify, request

from orchestrator.clients.db.wrappers.application import ApplicationsDBWrapper
from orchestrator.resources.application import Application as ApplicationDTO
from orchestrator.resources.types import Country
from orchestrator.utils.logging import log_execution_time, logger
from orchestrator.utils.wrappers import run_route_safely


@run_route_safely(message="Error creating application", unwrap_body=True)
@log_execution_time(description="Creating a new loan application")
def create_application() -> Response:
    application_data = request.get_json(force=True)

    wrapper = ApplicationsDBWrapper()
    application_dao = wrapper.create_application(
        applicant_name=application_data["applicantName"],
        amount=application_data["amount"],
        monthly_income=application_data["monthlyIncome"],
        declared_debts=application_data["declaredDebts"],
        country=Country(application_data["country"]),
        loan_purpose=application_data["loanPurpose"],
    )
    application = ApplicationDTO.from_dao(application_dao)

    return jsonify(application.to_dict())


@run_route_safely(message="Error fetching loan applications", unwrap_body=False)
@log_execution_time(description="Fetching loan applications")
def get_loan_applications() -> Response:
    status_in = request.args.getlist("statusIn")
    status_not_in = request.args.getlist("statusNotIn")

    wrapper = ApplicationsDBWrapper()

    application_daos = wrapper.get_applications_by_value(
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
    applications = [ApplicationDTO.from_dao(app_dao) for app_dao in application_daos]

    return jsonify([app.to_dict() for app in applications])


def get_application_by_key(application_key: str) -> Response:
    @run_route_safely(
        message=f"Error fetching loan application with key {application_key}",
        unwrap_body=False,
    )
    @log_execution_time(
        description=f"Fetching loan application with key {application_key}"
    )
    def inner() -> Response:
        wrapper = ApplicationsDBWrapper()
        application_daos = wrapper.get_applications_by_value(key=application_key)

        if not application_daos:
            logger.warning(f"Application with key {application_key} not found")
            response = json.dumps(
                {"error": f"Application with key {application_key} not found"}
            )
            return Response(
                response=response,
                status=404,
                mimetype="application/json",
            )

        application = ApplicationDTO.from_dao(application_daos[0])
        return jsonify(application.to_dict())

    return inner()
