import os
from datetime import timedelta

class Config:
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://localhost/synergy_tracker')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24)))
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # CORS
    CORS_HEADERS = 'Content-Type,Authorization'

class DevelopmentConfig(Config):
    DEBUG = True
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-please-change')

class ProductionConfig(Config):
    DEBUG = False
    # JWT_SECRET_KEY is required in production (validated in create_app)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')

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