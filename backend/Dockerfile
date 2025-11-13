FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry==1.7.1

# Configure Poetry to not create virtual environment (we're in a container)
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

# Copy Poetry configuration files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --no-dev && rm -rf $POETRY_CACHE_DIR

# Copy source code
COPY src/ ./src/

# Copy config generation script
COPY generate_config.py ./

# Create entrypoint script that generates config.yaml and runs gunicorn
RUN echo '#!/bin/sh\npoetry run python generate_config.py\nexec poetry run gunicorn --bind 0.0.0.0:5000 --workers 4 backend_app.wsgi:application' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Use entrypoint script
CMD ["/app/entrypoint.sh"]

