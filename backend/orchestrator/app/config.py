"""Configuration management for the Flask application."""

import os
from pathlib import Path
from typing import Any

import yaml


class Config:
    """Application configuration loaded from YAML file."""

    def __init__(self, config_path: str | None = None):
        """
        Initialize configuration from YAML file.

        Args:
            config_path: Path to the YAML configuration file.
                        If None, looks for config.yaml in the backend directory.
        """
        if config_path is None:
            # Default to config.yaml in the app root directory
            # In local dev:
            #   backend/src/app/config.py -> backend/config.yaml (3 levels up)
            # In Docker:
            #   /app/src/app/config.py -> /app/config.yaml (3 levels up)
            app_root = Path(__file__).parent.parent.parent
            config_path = app_root / "config.yaml"

        config_path = Path(config_path)

        if not config_path.exists():
            raise FileNotFoundError(
                f"Configuration file not found: {config_path}. "
                "Please create config.yaml based on config.yaml.example"
            )

        with open(config_path, "r") as f:
            config_data = yaml.safe_load(f) or {}

        # Database configuration
        db_config = config_data.get("database", {})
        # Support both "user"/"username" and "dbname"/"database" for backward compatibility
        self.POSTGRES_USER = db_config.get("username") or db_config.get(
            "user", "postgres"
        )
        self.POSTGRES_PASSWORD = db_config.get("password", "postgres")
        self.POSTGRES_DB = db_config.get("database") or db_config.get(
            "dbname", "loan_orchestrator"
        )
        self.POSTGRES_HOST = db_config.get("host", "localhost")
        self.POSTGRES_PORT = db_config.get("port", 5432)

        # Flask configuration
        flask_config = config_data.get("flask", {})
        self.SECRET_KEY = flask_config.get("secret_key", os.urandom(24).hex())
        self.DEBUG = flask_config.get("debug", False)
        self.HOST = flask_config.get("host", "0.0.0.0")
        self.PORT = flask_config.get("port", 5000)
        self.VERSION = flask_config.get("version", "v1")

        # SQLAlchemy database URI
        self.SQLALCHEMY_DATABASE_URI = (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        self.SQLALCHEMY_TRACK_MODIFICATIONS = False

    def to_dict(self) -> dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            "POSTGRES_USER": self.POSTGRES_USER,
            "POSTGRES_PASSWORD": self.POSTGRES_PASSWORD,
            "POSTGRES_DB": self.POSTGRES_DB,
            "POSTGRES_HOST": self.POSTGRES_HOST,
            "POSTGRES_PORT": self.POSTGRES_PORT,
            "SECRET_KEY": self.SECRET_KEY,
            "DEBUG": self.DEBUG,
            "HOST": self.HOST,
            "PORT": self.PORT,
            "SQLALCHEMY_DATABASE_URI": self.SQLALCHEMY_DATABASE_URI,
            "SQLALCHEMY_TRACK_MODIFICATIONS": (self.SQLALCHEMY_TRACK_MODIFICATIONS),
            "VERSION": self.VERSION,
        }
