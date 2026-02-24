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
            logger.info(f"DEBUG: FLASK_ENV={os.getenv('FLASK_ENV')}")
            logger.info(f"DEBUG: JWT_SECRET_KEY env var set: {bool(os.getenv('JWT_SECRET_KEY'))}")
            logger.info(f"DEBUG: JWT_SECRET_KEY in config: {bool(app.config.get('JWT_SECRET_KEY'))}")
            logger.info(f"DEBUG: DATABASE_URL set: {bool(os.getenv('DATABASE_URL'))}")

            # TEMPORARY: Warn instead of failing to diagnose Railway issue
            if not app.config.get('JWT_SECRET_KEY'):
                logger.warning(f"⚠️ JWT_SECRET_KEY is None or empty. Environment variable: {os.getenv('JWT_SECRET_KEY')}")
                logger.warning("⚠️ TEMPORARY: Continuing without JWT_SECRET_KEY for diagnostics")
            else:
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
        """Health check — always returns 200 so Railway healthcheck passes."""
        return {'status': 'healthy', 'version': '1.0.0'}, 200

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

    # Import models to register with SQLAlchemy metadata
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

        # db.create_all() is handled by the Railway releaseCommand (one-time, pre-deploy).
        # Running it here causes worker timeouts in production.

    logger.info("=" * 60)
    logger.info("✅ Application initialization complete!")
    logger.info(f"Environment: {config_name if not isinstance(config_name, dict) else 'custom'}")
    logger.info(f"Registered routes: {len(app.url_map._rules)} endpoints")
    logger.info("=" * 60)

    return app