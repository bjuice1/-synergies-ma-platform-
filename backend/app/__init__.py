"""
Flask application factory.

Creates and configures the Flask application instance.
"""
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()
db = SQLAlchemy()

def create_app(config_name=None):
    """
    Application factory function.

    Args:
        config_name: Configuration environment ('development', 'testing', 'production')
                    or a dict with configuration values.
                    If None, reads from FLASK_ENV environment variable

    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)

    # Handle both string config name and dict config
    if isinstance(config_name, dict):
        # Direct config dict passed (e.g., from tests)
        app.config.update(config_name)
    else:
        # Config name string
        if config_name is None:
            config_name = os.getenv('FLASK_ENV', 'development')
        from backend.config import get_config
        app.config.from_object(get_config(config_name))

        # Validate production config
        if config_name == 'production':
            if not app.config.get('JWT_SECRET_KEY'):
                raise ValueError(
                    "JWT_SECRET_KEY must be set in production environment. "
                    "Set the JWT_SECRET_KEY environment variable."
                )

    db.init_app(app)
    CORS(app, origins=app.config.get('CORS_ORIGINS', '*'))

    # Register blueprints
    from backend.routes.auth_routes import bp as auth_bp
    from backend.routes.synergies_routes import bp as synergies_bp
    from backend.routes.industries_routes import bp as industries_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(synergies_bp)
    app.register_blueprint(industries_bp)

    # NOTE: db.create_all() commented out - use Alembic migrations instead
    # with app.app_context():
    #     db.create_all()

    return app