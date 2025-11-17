"""WSGI entry point for gunicorn."""

from orchestrator.app.app import APP

application = APP
