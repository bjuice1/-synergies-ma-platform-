"""
Pytest configuration and shared fixtures for all tests.
Provides isolated test environment with in-memory SQLite database.
"""
import pytest
from backend import create_app
from backend.extensions import db
from backend.app.models import Industry, Function, Synergy, SynergyType, SynergyStatus
from datetime import date

@pytest.fixture(scope='function')
def app():
    """
    Create Flask app configured for testing.
    Uses in-memory SQLite database for complete isolation.
    """
    app = create_app()
    app.config.update({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'SQLALCHEMY_TRACK_MODIFICATIONS': False})
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def db_session(app):
    """
    Provide database session with automatic rollback after each test.
    Ensures zero state pollution between tests.
    """
    with app.app_context():
        yield db.session
        db.session.rollback()

@pytest.fixture(scope='function')
def client(app):
    """
    Provide Flask test client for API endpoint testing.
    """
    return app.test_client()

@pytest.fixture(scope='function')
def sample_industries(db_session):
    """
    Create sample industry records for testing.
    """
    industries = [Industry(name='Manufacturing', description='Manufacturing operations'), Industry(name='Retail', description='Retail operations'), Industry(name='Healthcare', description='Healthcare services')]
    for industry in industries:
        db_session.add(industry)
    db_session.commit()
    return industries

@pytest.fixture(scope='function')
def sample_functions(db_session):
    """
    Create sample function records for testing.
    """
    functions = [Function(name='Finance', description='Financial management'), Function(name='IT', description='Information Technology'), Function(name='Operations', description='Operations management')]
    for func in functions:
        db_session.add(func)
    db_session.commit()
    return functions

@pytest.fixture(scope='function')
def sample_synergies(db_session, sample_industries, sample_functions):
    """
    Create sample synergy records for testing.
    Depends on industries and functions being created first.
    """
    synergies = [Synergy(synergy_value=1000000, synergy_type=SynergyType.COST_REDUCTION, description='Consolidate procurement processes', realization_timeline='Q2 2024', status=SynergyStatus.IDENTIFIED, industry_id=sample_industries[0].id, function_id=sample_functions[0].id), Synergy(synergy_value=500000, synergy_type=SynergyType.REVENUE_ENHANCEMENT, description='Cross-sell products to new customer base', realization_timeline='Q3 2024', status=SynergyStatus.IN_PROGRESS, industry_id=sample_industries[1].id, function_id=sample_functions[1].id), Synergy(synergy_value=750000, synergy_type=SynergyType.OPERATIONAL_EFFICIENCY, description='Optimize supply chain logistics', realization_timeline='Q4 2024', status=SynergyStatus.REALIZED, industry_id=sample_industries[0].id, function_id=sample_functions[2].id)]
    for synergy in synergies:
        db_session.add(synergy)
    db_session.commit()
    return synergies

@pytest.fixture(scope='function')
def sample_data(sample_industries, sample_functions, sample_synergies):
    """
    Aggregate fixture providing all sample data.
    Useful when tests need access to all entities.
    """
    return {'industries': sample_industries, 'functions': sample_functions, 'synergies': sample_synergies}