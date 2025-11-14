from flask import Flask

from .health import health_check


def register_routes(app: Flask) -> None:
    """
    Register all routes with the Flask application.

    Args:
        app: Flask application instance to register routes with.
    """
    app.add_url_rule("/health", "health_check", health_check, methods=["GET"])
