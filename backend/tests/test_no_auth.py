"""
Verification tests - Ensure no authentication errors occur
"""
import pytest
from backend import create_app
from backend.app.models import db, Item

@pytest.fixture
def app():
    """Create test app"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

def test_get_items_no_auth(client):
    """GET /api/items should work without authentication"""
    response = client.get('/api/items')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_create_item_no_auth(client):
    """POST /api/items should work without authentication"""
    response = client.post('/api/items', json={'name': 'Test Item', 'description': 'Test Description'})
    assert response.status_code == 201
    assert response.json['name'] == 'Test Item'

def test_no_authorization_header_required(client):
    """Requests without Authorization header should succeed"""
    response = client.get('/api/items', headers={})
    assert response.status_code == 200

def test_authorization_header_ignored(client):
    """Authorization headers should be ignored (not cause errors)"""
    response = client.get('/api/items', headers={'Authorization': 'Bearer fake-token-12345'})
    assert response.status_code == 200