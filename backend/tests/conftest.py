"""
Shared pytest fixtures for all tests.
Provides Flask app, database, client, and authentication mocking.
"""
import pytest
import sys
from pathlib import Path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))
from backend import create_app, db
from backend.app.models.user import User
from unittest.mock import patch, MagicMock

@pytest.fixture(scope='function')
def app():
    """
    Create and configure a Flask app instance for testing.
    Function scope ensures isolation between tests.
    """
    test_config = {'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'SQLALCHEMY_TRACK_MODIFICATIONS': False, 'SECRET_KEY': 'test-secret-key', 'JWT_SECRET_KEY': 'test-jwt-secret', 'WTF_CSRF_ENABLED': False}
    app = create_app(test_config)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    """
    Provide a test client for making HTTP requests.
    """
    return app.test_client()

@pytest.fixture(scope='function')
def runner(app):
    """
    Provide a CLI runner for testing Click commands.
    """
    return app.test_cli_runner()

@pytest.fixture(scope='function')
def db_session(app):
    """
    Provide a database session with automatic rollback.
    Ensures test isolation at the database level.
    """
    with app.app_context():
        yield db.session

@pytest.fixture(scope='function')
def sample_user(app):
    """
    Create a sample user for testing.
    """
    with app.app_context():
        user = User(auth0_id='test_auth0_123', email='test@example.com', name='Test User')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        user_id = user.id
        yield user

# DISABLED: Document and Conversation models no longer exist in current codebase
# @pytest.fixture(scope='function')
# def sample_document(app, sample_user):
#     """
#     Create a sample document for testing.
#     """
#     with app.app_context():
#         document = Document(user_id=sample_user.id, filename='test_document.pdf', file_path='/uploads/test_document.pdf', file_size=1024, mime_type='application/pdf')
#         db.session.add(document)
#         db.session.commit()
#         db.session.refresh(document)
#         yield document

# @pytest.fixture(scope='function')
# def sample_conversation(app, sample_user):
#     """
#     Create a sample conversation for testing.
#     """
#     with app.app_context():
#         conversation = Conversation(user_id=sample_user.id, title='Test Conversation')
#         db.session.add(conversation)
#         db.session.commit()
#         db.session.refresh(conversation)
#         yield conversation

@pytest.fixture(scope='function')
def auth_headers():
    """
    Provide mock authentication headers.
    """
    return {'Authorization': 'Bearer mock-jwt-token'}

@pytest.fixture(scope='function')
def mock_auth0_verify():
    """
    Mock Auth0 token verification.
    Patches the verify_token decorator to bypass authentication.
    """
    with patch('app.auth.verify_token') as mock_verify:
        mock_verify.return_value = {'sub': 'test_auth0_123', 'email': 'test@example.com', 'name': 'Test User'}
        yield mock_verify

@pytest.fixture(scope='function')
def mock_require_auth(sample_user):
    """
    Mock the require_auth decorator to bypass authentication.
    Returns the sample_user automatically.
    """

    def decorator(f):

        def wrapper(*args, **kwargs):
            return f(sample_user, *args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    with patch('app.auth.require_auth', side_effect=decorator):
        yield

@pytest.fixture(scope='function')
def mock_openai():
    """
    Mock OpenAI API calls to avoid actual API requests in tests.
    """
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content='This is a mock AI response.'))]
    with patch('openai.ChatCompletion.create', return_value=mock_response):
        yield mock_response

@pytest.fixture(scope='function')
def mock_pinecone():
    """
    Mock Pinecone vector database operations.
    """
    mock_index = MagicMock()
    mock_index.upsert.return_value = {'upserted_count': 1}
    mock_index.query.return_value = {'matches': [{'id': 'test_chunk_1', 'score': 0.95, 'metadata': {'text': 'Sample document text'}}]}
    with patch('pinecone.Index', return_value=mock_index):
        yield mock_index

@pytest.fixture(scope='function')
def uploaded_file():
    """
    Create a mock uploaded file for testing file uploads.
    """
    from io import BytesIO
    from werkzeug.datastructures import FileStorage
    file_content = b'This is a test PDF content'
    file = FileStorage(stream=BytesIO(file_content), filename='test.pdf', content_type='application/pdf')
    return file

@pytest.fixture(autouse=True)
def reset_db_session(app):
    """
    Automatically reset the database session before each test.
    Prevents session state leakage between tests.
    """
    with app.app_context():
        db.session.remove()
        yield
        db.session.remove()