"""
Flask application factory.

Creates and configures the Flask application instance.
"""
import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from backend.extensions import db, jwt

load_dotenv()

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
    jwt.init_app(app)
    CORS(app, origins=app.config.get('CORS_ORIGINS', '*'))

    # Register blueprints
    from backend.routes.auth_routes import bp as auth_bp
    from backend.routes.synergies_routes import bp as synergies_bp
    from backend.routes.industries_routes import bp as industries_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(synergies_bp)
    app.register_blueprint(industries_bp)

    # Create tables on startup (for development)
    with app.app_context():
        # Import all models to register them with SQLAlchemy
        from backend.app.models import (
            User, Organization, Assessment, AssessmentQuestion, AssessmentResponse,
            LearningPath, LearningPathItem, Resource
        )
        from backend.app.models.synergy import Synergy, SynergyMetric
        from backend.app.models.industry import Industry
        from backend.app.models.company import Company
        from backend.app.models.function import Function
        from backend.app.models.category import Category
        from backend.app.models.activity import Activity
        from backend.app.models.comment import Comment
        from backend.app.models.mention import Mention

        db.create_all()
        print(f"✅ Created {len(db.metadata.tables)} tables")

    return app