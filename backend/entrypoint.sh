#!/bin/sh
# Entrypoint script for the backend container
# Generates config.yaml, applies migrations, and starts gunicorn

set -eu

# Set default port to 5001 if FLASK_PORT is not set
PORT=${FLASK_PORT:-5001}

echo "[entrypoint] Generating config.yaml from environment variables..."
poetry run python generate_config.py

echo "[entrypoint] Running database migrations..."
poetry run alembic upgrade head

echo "[entrypoint] Starting gunicorn on port ${PORT}..."
exec poetry run gunicorn --bind 0.0.0.0:$PORT --workers 4 backend_app.wsgi:application

