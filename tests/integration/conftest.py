import pytest
from backend import create_app, db
from backend.app.models.user import User
from flask_jwt_extended import create_access_token

@pytest.fixture(scope='session')
def app():
    """Create application for the tests with test configuration"""
    app = create_app('testing')
    ctx = app.app_context()
    ctx.push()
    yield app
    ctx.pop()

@pytest.fixture(scope='session')
def _db(app):
    """Create database schema for tests"""
    db.create_all()
    yield db
    db.drop_all()

@pytest.fixture(scope='function')
def test_db(_db):
    """Provide clean database state for each test via transaction rollback"""
    connection = _db.engine.connect()
    transaction = connection.begin()
    options = dict(bind=connection, binds={})
    session = _db.create_scoped_session(options=options)
    _db.session = session
    yield _db
    transaction.rollback()
    connection.close()
    session.remove()

@pytest.fixture(scope='function')
def client(app, test_db):
    """Flask test client with clean database"""
    return app.test_client()

@pytest.fixture(scope='function')
def test_user(test_db):
    """Create test user"""
    user = User(username='testuser', email='test@example.com')
    user.set_password('TestPassword123!')
    test_db.session.add(user)
    test_db.session.commit()
    return user

@pytest.fixture(scope='function')
def auth_token(app, test_user):
    """Generate JWT access token for test user"""
    return create_access_token(identity=test_user.id)

@pytest.fixture(scope='function')
def auth_headers(auth_token):
    """Generate authorization headers with JWT token"""
    return {'Authorization': f'Bearer {auth_token}', 'Content-Type': 'application/json'}

@pytest.fixture(scope='function')
def another_user(test_db):
    """Create second test user for permission/isolation tests"""
    user = User(username='anotheruser', email='another@example.com')
    user.set_password('AnotherPassword123!')
    test_db.session.add(user)
    test_db.session.commit()
    return user