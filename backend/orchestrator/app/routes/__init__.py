from flask import Flask

from .application import create_application, get_loan_applications
from .health import health_check


def register_routes(app: Flask) -> None:
    # App health
    app.add_url_rule("/health", "health_check", health_check, methods=["GET"])

    # Loan-application routes
    app.add_url_rule("/application", view_func=create_application, methods=["POST"])
    app.add_url_rule("/application", view_func=get_loan_applications, methods=["GET"])
