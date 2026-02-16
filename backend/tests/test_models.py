"""
Tests for database models.
"""
import pytest
from datetime import datetime
from backend.app.models import User, Document, Conversation, Message

def test_user_creation(app, db_session):
    """Test creating a user model."""
    user = User(auth0_id='auth0_test_123', email='newuser@example.com', name='New User')
    db_session.add(user)
    db_session.commit()
    assert user.id is not None
    assert user.email == 'newuser@example.com'
    assert user.name == 'New User'
    assert isinstance(user.created_at, datetime)

def test_user_repr(sample_user):
    """Test user string representation."""
    assert repr(sample_user) == f'<User {sample_user.email}>'

def test_document_creation(app, sample_user, db_session):
    """Test creating a document model."""
    document = Document(user_id=sample_user.id, filename='new_doc.pdf', file_path='/uploads/new_doc.pdf', file_size=2048, mime_type='application/pdf')
    db_session.add(document)
    db_session.commit()
    assert document.id is not None
    assert document.filename == 'new_doc.pdf'
    assert document.user_id == sample_user.id
    assert document.processing_status == 'pending'

def test_document_user_relationship(sample_document, sample_user):
    """Test document-user relationship."""
    assert sample_document.user.id == sample_user.id
    assert sample_document in sample_user.documents

def test_conversation_creation(app, sample_user, db_session):
    """Test creating a conversation model."""
    conversation = Conversation(user_id=sample_user.id, title='New Conversation')
    db_session.add(conversation)
    db_session.commit()
    assert conversation.id is not None
    assert conversation.title == 'New Conversation'
    assert conversation.user_id == sample_user.id

def test_message_creation(app, sample_conversation, db_session):
    """Test creating a message model."""
    message = Message(conversation_id=sample_conversation.id, role='user', content='Hello, AI!')
    db_session.add(message)
    db_session.commit()
    assert message.id is not None
    assert message.content == 'Hello, AI!'
    assert message.role == 'user'
    assert message.conversation_id == sample_conversation.id

def test_conversation_messages_relationship(app, sample_conversation, db_session):
    """Test conversation-messages relationship."""
    message1 = Message(conversation_id=sample_conversation.id, role='user', content='First message')
    message2 = Message(conversation_id=sample_conversation.id, role='assistant', content='Second message')
    db_session.add_all([message1, message2])
    db_session.commit()
    assert len(sample_conversation.messages) == 2
    assert message1 in sample_conversation.messages
    assert message2 in sample_conversation.messages