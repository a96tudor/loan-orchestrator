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


@log_execution_time(description="Fetching loan applications")
def get_loan_applications() -> Response:
    status_in = request.args.getlist("statusIn")
    status_not_in = request.args.getlist("statusNotIn")

    wrapper = ApplicationsDBWrapper()

    try:
        applications = wrapper.get_applications_by_value(
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
    except Exception as e:
        logger.error(f"Error fetching applications: {e}", exc_info=True)
        return Response(
            response='{"error": "Internal server error"}',
            status=500,
            mimetype="application/json",
        )

    response_body = [
        {
            "key": app.key,
            "applicantName": app.applicant_name,
            "amount": app.amount,
            "monthlyIncome": app.monthly_income,
            "declaredDebts": app.declared_debts,
            "country": app.country,
            "loanPurpose": app.loan_purpose,
            "status": app.status.value,
        }
        for app in applications
    ]

    return jsonify(response_body)
