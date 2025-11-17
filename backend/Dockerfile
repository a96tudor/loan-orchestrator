FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required for building and running psycopg / gunicorn
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# Install Poetry
ENV POETRY_HOME=/opt/poetry \
    PATH="/opt/poetry/bin:${PATH}" \
    POETRY_VENV_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1
RUN pip install --no-cache-dir poetry

# Ensure OPENAI_API_KEY can be provided either at build time (ARG) or runtime (ENV)
ARG OPENAI_API_KEY=""
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# 1. Copy the entire backend directory
COPY . /app

# 2. Install the package using Poetry (includes dependencies)
RUN poetry install --no-root

# 3-5 happen at runtime via the entrypoint script:
#    3. Run alembic upgrade head
#    4. Generate config.yaml
#    5. Launch the API on port 5001
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 5001

ENTRYPOINT ["/app/docker-entrypoint.sh"]

