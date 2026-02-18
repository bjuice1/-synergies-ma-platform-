web: gunicorn backend.app:create_app --bind 0.0.0.0:8000 --workers 2 --threads 4 --timeout 120 --log-level debug --access-logfile - --error-logfile -
release: cd backend && alembic upgrade head
