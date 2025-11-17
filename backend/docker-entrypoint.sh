#!/bin/sh
set -eu

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "[entrypoint] ERROR: OPENAI_API_KEY environment variable is not set."
  exit 1
fi

echo "[entrypoint] Running alembic migrations..."
poetry run alembic upgrade head

echo "[entrypoint] Generating config.yaml..."
poetry run python generate_config.py

echo "[entrypoint] Starting API on port 5001..."
exec poetry run gunicorn --bind 0.0.0.0:5001 orchestrator.app.wsgi:application

