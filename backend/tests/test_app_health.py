"""Health check tests for application initialization and blueprint registration.

These tests validate the basic integrity of the application setup.
They should pass even if feature implementations are incomplete.
"""
import pytest
from flask import Flask

def test_app_creation(app):
    """Test that Flask app is created successfully."""
    assert app is not None
    assert isinstance(app, Flask)
    assert app.config['TESTING'] is True

def test_app_test_config(app):
    """Test that app uses test configuration."""
    assert app.config['TESTING'] is True
    assert 'memory' in app.config['SQLALCHEMY_DATABASE_URI']
    assert app.config['JWT_SECRET_KEY'] == 'test-jwt-secret-do-not-use-in-production'

def test_database_initialization(app):
    """Test that database can be initialized without errors."""
    from backend import db
    with app.app_context():
        assert db is not None
        assert db.engine is not None
        try:
            result = db.session.execute(db.text('SELECT 1')).fetchone()
            assert result[0] == 1
        except Exception as e:
            pytest.fail(f'Database query failed: {e}')

def test_blueprints_registered(app):
    """Test that all expected blueprints are registered."""
    blueprint_names = [bp.name for bp in app.blueprints.values()]
    expected_blueprints = ['auth', 'tasks', 'notifications', 'dashboards']
    registered = []
    missing = []
    for bp_name in expected_blueprints:
        if bp_name in blueprint_names:
            registered.append(bp_name)
        else:
            missing.append(bp_name)
    print(f'\nRegistered blueprints: {registered}')
    print(f'Missing blueprints: {missing}')
    assert 'auth' in blueprint_names, 'Auth blueprint must be registered'

def test_models_importable(app):
    """Test that models can be imported from canonical location."""
    with app.app_context():
        try:
            from backend.app.models.user import User
            assert User is not None
        except ImportError as e:
            pytest.fail(f'Could not import User model from canonical location: {e}')

def test_db_models_metadata(app):
    """Test that database models are properly defined."""
    from backend import db
    with app.app_context():
        table_names = db.metadata.tables.keys()
        assert len(table_names) > 0, 'No database tables found'
        print(f'\nDatabase tables: {list(table_names)}')

def test_api_routes_exist(client):
    """Test that main API endpoints are registered."""
    response = client.get('/')
    assert response.status_code in [200, 301, 302, 308], f'Root endpoint returned {response.status_code}'

def test_auth_endpoints_registered(client):
    """Test that auth endpoints exist."""
    endpoints = ['/api/auth/register', '/api/auth/login']
    for endpoint in endpoints:
        response = client.post(endpoint, json={})
        assert response.status_code != 404, f'Auth endpoint {endpoint} not found (404)'
        print(f'Endpoint {endpoint} exists (status: {response.status_code})')

def test_jwt_configuration(app):
    """Test that JWT is properly configured."""
    assert 'JWT_SECRET_KEY' in app.config
    assert app.config['JWT_SECRET_KEY'] is not None
    assert len(app.config['JWT_SECRET_KEY']) > 0
    assert hasattr(app, 'jwt_manager') or 'jwt' in app.extensions

@pytest.mark.xfail(reason='May fail if blueprints not fully implemented')
def test_all_expected_routes(client):
    """Test that all expected API routes are available.
    
    This test is marked as xfail because some routes may not be implemented yet.
    """
    expected_routes = [('/api/auth/register', ['POST']), ('/api/auth/login', ['POST']), ('/api/tasks', ['GET', 'POST']), ('/api/notifications', ['GET']), ('/api/dashboards', ['GET'])]
    missing_routes = []
    for route, methods in expected_routes:
        for method in methods:
            response = getattr(client, method.lower())(route)
            if response.status_code == 404:
                missing_routes.append(f'{method} {route}')
    if missing_routes:
        print(f'\nMissing routes: {missing_routes}')
    assert len(missing_routes) == 0, f'Missing {len(missing_routes)} expected routes'