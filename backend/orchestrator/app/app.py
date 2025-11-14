"""Flask application factory."""

import os

from flask import Flask

from orchestrator.app.config import Config
from orchestrator.app.routes import register_routes


def create_app(config_path: str | None = None) -> Flask:
    """
    Create and configure the Flask application instance.

    Args:
        config_path: Optional path to the YAML configuration file.
            If None, uses CONFIG_PATH environment variable or defaults to config.yaml.

    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)

    # Load configuration from YAML file
    if config_path is None:
        config_path = os.getenv("CONFIG_PATH")

    config = Config(config_path)
    app.config.update(config.to_dict())

    # Register routes
    register_routes(app)

    return app


APP = create_app()
