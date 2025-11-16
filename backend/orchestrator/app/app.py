"""Flask application factory."""

import os
import typing as t

from flask import Flask
from flask import typing as ft
from flask_cors import CORS

from orchestrator.app.config import Config
from orchestrator.app.routes import register_routes


class OrchestratorApp(Flask):
    def add_url_rule(
        self,
        rule: str,
        endpoint: str | None = None,
        view_func: ft.RouteCallable | None = None,
        provide_automatic_options: bool | None = None,
        **options: t.Any,
    ) -> None:
        version = self.config.get("VERSION")
        if not rule.startswith(f"/api/{version}"):
            rule = f"/api/{version}{rule}"

        super().add_url_rule(
            rule,
            endpoint,
            view_func,
            provide_automatic_options,
            **options,
        )

    def load_config(self, config_path: str | None = None) -> None:
        if config_path is None:
            config_path = os.getenv("CONFIG_PATH")

        config = Config(config_path)
        self.config.update(config.to_dict())


def create_app(config_path: str | None = None) -> Flask:
    app = OrchestratorApp(__name__)
    app.load_config(config_path)

    # Register routes
    register_routes(app)

    return app


APP = create_app()
_CORS = CORS(
    APP,
    resources={
        r"*": {"/evaluations/*": "*"}
    }
)
