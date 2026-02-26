#!/bin/bash
set -e
PORT=${PORT:-8000}
echo "Starting gunicorn on port $PORT..."
exec gunicorn "backend.app:create_app()" \
  --bind "0.0.0.0:${PORT}" \
  --workers 1 \
  --worker-class sync \
  --timeout 120 \
  --log-level info \
  --access-logfile - \
  --error-logfile -
