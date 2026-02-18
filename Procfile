web: gunicorn backend.app:create_app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120
release: cd backend && alembic upgrade head
