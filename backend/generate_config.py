#!/usr/bin/env python3
"""Generate config.yaml from environment variables."""

import os
from pathlib import Path

import yaml

# Get configuration from environment variables
config = {
    "database": {
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "dbname": os.getenv("POSTGRES_DB", "loan_orchestrator"),
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
    },
    "flask": {
        "secret_key": os.getenv("SECRET_KEY", "change-this-to-a-random-secret-key-in-production"),
        "debug": os.getenv("FLASK_DEBUG", "false").lower() in ("true", "1", "yes"),
        "host": os.getenv("FLASK_HOST", "0.0.0.0"),
        "port": int(os.getenv("FLASK_PORT", "5000")),
    },
}

# Write config.yaml to /app/config.yaml
config_path = Path("/app/config.yaml")
with open(config_path, "w") as f:
    yaml.dump(config, f, default_flow_style=False, sort_keys=False)

print(f"Generated config.yaml at {config_path}")

