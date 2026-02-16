"""
Alembic migration environment configuration.
Connects to database and registers models for auto-generation.
"""
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os
# Add project root to path (two levels up from env.py: backend/alembic/env.py -> project root)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)
from backend.config import get_config
from backend.extensions import db
# Import all models to register them with db.Model
from backend.app.models import (
    User,
    Organization,
    Assessment,
    AssessmentQuestion,
    AssessmentResponse,
    LearningPath,
    LearningPathItem,
    Resource
)

# Get database URL from config
app_config = get_config(os.getenv('FLASK_ENV', 'development'))
database_url = app_config.SQLALCHEMY_DATABASE_URI

config = context.config
config.set_main_option('sqlalchemy.url', database_url)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
target_metadata = db.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option('sqlalchemy.url')
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={'paramstyle': 'named'})
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix='sqlalchemy.', poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()