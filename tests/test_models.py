"""
Unit tests for SQLAlchemy models.
Tests model behavior, relationships, enums, constraints, and defaults.
"""
import pytest
from backend.app.models import Industry, Function, Synergy, SynergyType, SynergyStatus
from backend.extensions import db
from sqlalchemy.exc import IntegrityError

class TestIndustryModel:
    """Tests for Industry model."""

    def test_create_industry(self, db_session):
        """Test creating an industry record."""
        industry = Industry(name='Technology', description='Tech sector')
        db_session.add(industry)
        db_session.commit()
        assert industry.id is not None
        assert industry.name == 'Technology'
        assert industry.description == 'Tech sector'
        assert industry.created_at is not None

    def test_industry_repr(self, db_session):
        """Test Industry string representation."""
        industry = Industry(name='Finance')
        assert repr(industry) == '<Industry Finance>'

    def test_industry_name_required(self, db_session):
        """Test that industry name is required."""
        industry = Industry(description='Missing name')
        db_session.add(industry)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_industry_cascades_to_synergies(self, db_session, sample_functions):
        """Test that deleting industry cascades to synergies."""
        industry = Industry(name='Test Industry')
        db_session.add(industry)
        db_session.commit()
        synergy = Synergy(synergy_value=100000, synergy_type=SynergyType.COST_REDUCTION, industry_id=industry.id, function_id=sample_functions[0].id)
        db_session.add(synergy)
        db_session.commit()
        synergy_id = synergy.id
        db_session.delete(industry)
        db_session.commit()
        assert db_session.get(Synergy, synergy_id) is None

class TestFunctionModel:
    """Tests for Function model."""

    def test_create_function(self, db_session):
        """Test creating a function record."""
        function = Function(name='HR', description='Human Resources')
        db_session.add(function)
        db_session.commit()
        assert function.id is not None
        assert function.name == 'HR'
        assert function.description == 'Human Resources'
        assert function.created_at is not None

    def test_function_repr(self, db_session):
        """Test Function string representation."""
        function = Function(name='Marketing')
        assert repr(function) == '<Function Marketing>'

    def test_function_name_required(self, db_session):
        """Test that function name is required."""
        function = Function(description='Missing name')
        db_session.add(function)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_function_cascades_to_synergies(self, db_session, sample_industries):
        """Test that deleting function cascades to synergies."""
        function = Function(name='Test Function')
        db_session.add(function)
        db_session.commit()
        synergy = Synergy(synergy_value=100000, synergy_type=SynergyType.COST_REDUCTION, industry_id=sample_industries[0].id, function_id=function.id)
        db_session.add(synergy)
        db_session.commit()
        synergy_id = synergy.id
        db_session.delete(function)
        db_session.commit()
        assert db_session.get(Synergy, synergy_id) is None

class TestSynergyModel:
    """Tests for Synergy model."""

    def test_create_synergy(self, db_session, sample_industries, sample_functions):
        """Test creating a synergy record with all fields."""
        synergy = Synergy(synergy_value=2000000, synergy_type=SynergyType.COST_REDUCTION, description='Test synergy', realization_timeline='Q1 2025', status=SynergyStatus.IDENTIFIED, industry_id=sample_industries[0].id, function_id=sample_functions[0].id)
        db_session.add(synergy)
        db_session.commit()
        assert synergy.id is not None
        assert synergy.synergy_value == 2000000
        assert synergy.synergy_type == SynergyType.COST_REDUCTION
        assert synergy.description == 'Test synergy'
        assert synergy.status == SynergyStatus.IDENTIFIED
        assert synergy.created_at is not None
        assert synergy.updated_at is not None

    def test_synergy_default_status(self, db_session, sample_industries, sample_functions):
        """Test that synergy status defaults to IDENTIFIED."""
        synergy = Synergy(synergy_value=100000, synergy_type=SynergyType.COST_REDUCTION, industry_id=sample_industries[0].id, function_id=sample_functions[0].id)
        db_session.add(synergy)
        db_session.commit()
        assert synergy.status == SynergyStatus.IDENTIFIED

    def test_synergy_repr(self, db_session, sample_industries, sample_functions):
        """Test Synergy string representation."""
        synergy = Synergy(synergy_value=100000, synergy_type=SynergyType.COST_REDUCTION, industry_id=sample_industries[0].id, function_id=sample_functions[0].id)
        db_session.add(synergy)
        db_session.commit()
        assert 'Synergy' in repr(synergy)
        assert str(synergy.id) in repr(synergy)

    def test_synergy_type_enum_values(self, db_session, sample_industries, sample_functions):
        """Test all SynergyType enum values are valid."""
        types = [SynergyType.COST_REDUCTION, SynergyType.REVENUE_ENHANCEMENT, SynergyType.OPERATIONAL_EFFICIENCY]
        for synergy_type in types:
            synergy = Synergy(synergy_value=100000, synergy_type=synergy_type, industry_id=sample_industries[0].id, function_id=sample_functions[0].id)
            db_session.add(synergy)
            db_session.commit()
            assert synergy.synergy_type == synergy_type
            db_session.delete(synergy)
            db_session.commit()

    def test_synergy_status_enum_values(self, db_session, sample_industries, sample_functions):
        """Test all SynergyStatus enum values are valid."""
        statuses = [SynergyStatus.IDENTIFIED, SynergyStatus.IN_PROGRESS, SynergyStatus.REALIZED]
        for status in statuses:
            synergy = Synergy(synergy_value=100000, synergy_type=SynergyType.COST_REDUCTION, status=status, industry_id=sample_industries[0].id, function_id=sample_functions[0].id)
            db_session.add(synergy)
            db_session.commit()
            assert synergy.status == status
            db_session.delete(synergy)
            db_session.commit()

    def test_synergy_industry_relationship(self, db_session, sample_industries, sample_functions):
        """Test synergy to industry relationship."""
        synergy = Synergy(synergy_value=100000, synergy_type=SynergyType.COST_REDUCTION, industry_id=sample_industries[0].id, function_id=sample_functions[0].id)
        db_session.add(synergy)
        db_session.commit()
        assert synergy.industry is not None
        assert synergy.industry.name == sample_industries[0].name
        assert synergy in sample_industries[0].synergies

    def test_synergy_function_relationship(self, db_session, sample_industries, sample_functions):
        """Test synergy to function relationship."""
        synergy = Synergy(synergy_value=100000, synergy_type=SynergyType.COST_REDUCTION, industry_id=sample_industries[0].id, function_id=sample_functions[0].id)
        db_session.add(synergy)
        db_session.commit()
        assert synergy.function is not None
        assert synergy.function.name == sample_functions[0].name
        assert synergy in sample_functions[0].synergies

    def test_synergy_requires_foreign_keys(self, db_session):
        """Test that synergy requires valid industry and function IDs."""
        synergy = Synergy(synergy_value=100000, synergy_type=SynergyType.COST_REDUCTION, industry_id=9999, function_id=9999)
        db_session.add(synergy)
        with pytest.raises(IntegrityError):
            db_session.commit()