from flask import Flask

from .application import (
    create_application,
    get_application_by_key,
    get_loan_applications,
)
from .evaluation import (
    evaluate_application,
    get_evaluation_by_id,
    get_evaluation_stats,
    get_evaluations_by_params,
)
from .health import health_check
from .pipeline import (
    create_pipeline,
    get_pipeline_by_id,
    get_pipelines,
    patch_pipeline_by_id,
    validate_pipeline_steps,
)


def register_routes(app: Flask) -> None:
    # App health
    app.add_url_rule("/health", "health_check", health_check, methods=["GET"])

    # Loan-application routes
    app.add_url_rule("/application", view_func=create_application, methods=["POST"])
    app.add_url_rule("/application", view_func=get_loan_applications, methods=["GET"])
    app.add_url_rule(
        "/application/<string:application_key>",
        view_func=get_application_by_key,
        methods=["GET"],
    )

    # Pipeline routes
    app.add_url_rule("/pipeline", view_func=create_pipeline, methods=["POST"])
    app.add_url_rule(
        "/pipeline/<string:pipeline_id>", view_func=get_pipeline_by_id, methods=["GET"]
    )
    app.add_url_rule("/pipeline", view_func=get_pipelines, methods=["GET"])
    app.add_url_rule(
        "/pipeline/<string:pipeline_id>",
        view_func=patch_pipeline_by_id,
        methods=["PATCH"],
    )
    app.add_url_rule(
        "/pipeline/validate",
        view_func=validate_pipeline_steps,
        methods=["POST"],
    )

    # Evaluation routes
    app.add_url_rule("/evaluate", view_func=evaluate_application, methods=["POST"])
    app.add_url_rule(
        "/evaluation/<string:evaluation_id>",
        view_func=get_evaluation_by_id,
        methods=["GET"],
    )
    app.add_url_rule(
        "/evaluations",
        view_func=get_evaluations_by_params,
        methods=["GET"],
    )
    app.add_url_rule(
        "/evaluations/stats",
        view_func=get_evaluation_stats,
        methods=["GET"],
    )
