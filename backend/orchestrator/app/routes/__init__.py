from flask import Flask

from .health import health_check


def register_routes(app: Flask) -> None:
    app.add_url_rule(f"/health", "health_check", health_check, methods=["GET"])
