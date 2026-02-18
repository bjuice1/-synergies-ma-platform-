"""
Flask application factory.

Creates and configures the Flask application instance.
"""
import os
import logging
import sys
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from backend.extensions import db, jwt

# Configure logging before anything else
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

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
    logger.info("=" * 60)
    logger.info("Starting application initialization...")

    app = Flask(__name__)

    # Handle both string config name and dict config
    if isinstance(config_name, dict):
        logger.info("Loading config from dict")
        app.config.update(config_name)
    else:
        # Config name string
        if config_name is None:
            config_name = os.getenv('FLASK_ENV', 'development')
        logger.info(f"Loading config for environment: {config_name}")

        try:
            from backend.config import get_config
            app.config.from_object(get_config(config_name))
            logger.info("✅ Config loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load config: {e}", exc_info=True)
            raise

        # Validate production config
        if config_name == 'production':
            logger.info("Validating production config...")
            if not app.config.get('JWT_SECRET_KEY'):
                raise ValueError(
                    "JWT_SECRET_KEY must be set in production environment. "
                    "Set the JWT_SECRET_KEY environment variable."
                )
            logger.info("✅ Production config valid")

    # Initialize extensions
    logger.info("Initializing database...")
    try:
        db.init_app(app)
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database init failed: {e}", exc_info=True)
        raise

    logger.info("Initializing JWT...")
    try:
        jwt.init_app(app)
        logger.info("✅ JWT initialized")
    except Exception as e:
        logger.error(f"❌ JWT init failed: {e}", exc_info=True)
        raise

    logger.info("Initializing CORS...")
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    logger.info(f"CORS origins: {cors_origins}")
    CORS(app, origins=cors_origins)
    logger.info("✅ CORS initialized")

    # Add root health check route
    @app.route('/')
    def index():
        return {
            'status': 'running',
            'message': 'Synergies M&A Platform API',
            'version': '1.0.0',
            'environment': config_name if not isinstance(config_name, dict) else 'custom'
        }

    @app.route('/health')
    def health():
        """Health check endpoint for monitoring"""
        try:
            # Test database connection
            with app.app_context():
                db.session.execute(db.text('SELECT 1'))
            db_status = 'connected'
        except Exception as e:
            logger.error(f"Health check DB error: {e}")
            db_status = 'disconnected'

        return {
            'status': 'healthy' if db_status == 'connected' else 'unhealthy',
            'database': db_status,
            'version': '1.0.0'
        }

    # Register blueprints
    logger.info("Registering blueprints...")
    try:
        from backend.routes.deals_routes import bp as deals_bp
        app.register_blueprint(deals_bp)
        logger.info("✅ Deals routes registered")
    except Exception as e:
        logger.error(f"❌ Failed to register deals routes: {e}", exc_info=True)
        # Continue anyway - other routes might work

    # Try to register other routes if they exist
    try:
        from backend.routes.auth_routes import bp as auth_bp
        app.register_blueprint(auth_bp)
        logger.info("✅ Auth routes registered")
    except ImportError:
        logger.warning("⚠️  Auth routes not found - skipping")
    except Exception as e:
        logger.error(f"❌ Auth routes error: {e}")

    try:
        from backend.routes.synergies_routes import bp as synergies_bp
        app.register_blueprint(synergies_bp)
        logger.info("✅ Synergies routes registered")
    except ImportError:
        logger.warning("⚠️  Synergies routes not found - skipping")
    except Exception as e:
        logger.error(f"❌ Synergies routes error: {e}")

    try:
        from backend.routes.industries_routes import bp as industries_bp
        app.register_blueprint(industries_bp)
        logger.info("✅ Industries routes registered")
    except ImportError:
        logger.warning("⚠️  Industries routes not found - skipping")
    except Exception as e:
        logger.error(f"❌ Industries routes error: {e}")

    # Import models to register with SQLAlchemy (don't fail if missing)
    logger.info("Importing models...")
    with app.app_context():
        try:
            from backend.app.models.synergy import Synergy, SynergyMetric
            from backend.app.models.industry import Industry
            from backend.app.models.company import Company
            from backend.app.models.deal import Deal
            logger.info("✅ Core models imported")
        except Exception as e:
            logger.error(f"❌ Model import error: {e}", exc_info=True)

        # Only create tables in development - production uses migrations
        if config_name == 'development' or os.getenv('FLASK_ENV') == 'development':
            try:
                db.create_all()
                logger.info(f"✅ Created {len(db.metadata.tables)} tables (development mode)")
            except Exception as e:
                logger.warning(f"⚠️  Could not create tables: {e}")
        else:
            logger.info("Production mode - skipping db.create_all() (use migrations)")

    logger.info("=" * 60)
    logger.info("✅ Application initialization complete!")
    logger.info(f"Environment: {config_name if not isinstance(config_name, dict) else 'custom'}")
    logger.info(f"Registered routes: {len(app.url_map._rules)} endpoints")
    logger.info("=" * 60)

    return app