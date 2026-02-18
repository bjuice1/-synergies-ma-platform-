import os
from datetime import timedelta

class Config:
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://localhost/synergy_tracker')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Connection pooling for production
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,          # Connections to keep open
        'pool_recycle': 3600,    # Recycle connections every hour
        'pool_pre_ping': True,   # Test connections before using
        'max_overflow': 10,      # Allow burst to 15 total connections
    }

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24)))
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # Flask secret key
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-in-production')

    # CORS
    CORS_HEADERS = 'Content-Type,Authorization'
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:////Users/JB/Documents/Synergies/backend/dev.db')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-please-change')

class ProductionConfig(Config):
    DEBUG = False
    # JWT_SECRET_KEY is required in production (validated in create_app)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    SECRET_KEY = os.getenv('SECRET_KEY')

    # Production database - Railway automatically provides DATABASE_URL
    # If DATABASE_URL starts with postgres://, update to postgresql://
    database_url = os.getenv('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = database_url

    # CORS for production
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://localhost/synergy_tracker_test'
    JWT_SECRET_KEY = 'test-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestConfig,
    'test': TestConfig,
    'default': DevelopmentConfig
}

def get_config(config_name='default'):
    """Get configuration class by name."""
    return config.get(config_name, config['default'])