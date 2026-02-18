#!/bin/bash
# Docker entrypoint for Railway deployment

# Use PORT from environment or default to 8000
PORT=${PORT:-8000}

echo "Starting gunicorn on port $PORT"

exec gunicorn backend.app:create_app \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --threads 4 \
  --timeout 120 \
  --log-level debug \
  --access-logfile - \
  --error-logfile -
