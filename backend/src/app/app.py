"""Flask application factory."""

import os

from backend_app.app.config import Config
from flask import Flask


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

    return app


if __name__ == "__main__" or __name__ == "backend_app.app":
    app = create_app()
    app.run(debug=app.config["DEBUG"], host=app.config["HOST"], port=app.config["PORT"])
