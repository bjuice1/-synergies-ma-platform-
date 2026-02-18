#!/bin/bash
# Railway start script - handles PORT variable expansion

# Default to 8000 if PORT not set
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
