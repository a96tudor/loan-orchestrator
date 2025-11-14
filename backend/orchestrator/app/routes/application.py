from flask import Response, jsonify, request

from orchestrator.clients.db.wrappers.application import ApplicationsDBWrapper
from orchestrator.resources.types import Country
from orchestrator.utils.logging import log_execution_time, logger


@log_execution_time(description="Creating a new loan application")
def create_application() -> Response:
    application_data = request.get_json(force=True)

    wrapper = ApplicationsDBWrapper()

    try:
        application = wrapper.create_application(
            applicant_name=application_data["applicantName"],
            amount=application_data["amount"],
            monthly_income=application_data["monthlyIncome"],
            declared_debts=application_data["declaredDebts"],
            country=Country(application_data["country"]),
            loan_purpose=application_data["loanPurpose"],
        )
    except KeyError:
        logger.error("Missing required field in request body", exc_info=True)
        return Response(
            response='{"error": "Invalid request body, missing required fields"}',
            status=400,
            mimetype="application/json",
        )
    except Exception:
        logger.error("Error creating application", exc_info=True)
        return Response(
            response='{"error": "Internal server error"}',
            status=500,
            mimetype="application/json",
        )

    response_body = {
        "key": application.key,
        "applicantName": application.applicant_name,
        "amount": application.amount,
        "monthlyIncome": application.monthly_income,
        "declaredDebts": application.declared_debts,
        "country": application.country,
        "loanPurpose": application.loan_purpose,
        "status": application.status,
    }

    return jsonify(response_body)
