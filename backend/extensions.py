"""
Flask extensions initialization.

This module provides centralized access to Flask extensions used across the application.
Models and other modules should import from here to avoid circular dependencies.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# Initialize SQLAlchemy instance
# This will be initialized with the app in app.py via db.init_app(app)
db = SQLAlchemy()

# Initialize JWT Manager
# This will be initialized with the app in app.py via jwt.init_app(app)
jwt = JWTManager()
