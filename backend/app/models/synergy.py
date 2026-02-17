"""
Synergy-related model definitions.
"""

from backend.app.extensions import db
from datetime import datetime


class Synergy(db.Model):
    """
    Represents a potential synergy between two companies.
    
    Attributes:
        id: Unique identifier
        company1_id: Foreign key to first company
        company2_id: Foreign key to second company
        synergy_type: Type of synergy (e.g., 'cost_reduction', 'revenue_enhancement')
        description: Detailed description of the synergy
        estimated_value: Estimated financial value of the synergy
        confidence_score: AI confidence score (0-100)
        status: Current status (e.g., 'identified', 'validated', 'rejected')
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
    """
    __tablename__ = 'synergies'

    id = db.Column(db.Integer, primary_key=True)
    company1_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    company2_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    industry_id = db.Column(db.Integer, db.ForeignKey('industries.id'), nullable=True, index=True)
    function_id = db.Column(db.Integer, db.ForeignKey('functions.id'), nullable=True, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True, index=True)
    deal_id = db.Column(db.Integer, db.ForeignKey('deals.id'), nullable=True, index=True)
    synergy_type = db.Column(db.String(50), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    value_low = db.Column(db.BigInteger, nullable=True)  # Lower bound of value range
    value_high = db.Column(db.BigInteger, nullable=True)  # Upper bound of value range
    estimated_value = db.Column(db.BigInteger, nullable=True)  # Kept for backward compatibility
    confidence_score = db.Column(db.Float)
    status = db.Column(db.String(20), nullable=False, default='identified', index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    industry = db.relationship(
        'Industry',
        back_populates='synergies'
    )

    function = db.relationship(
        'Function',
        back_populates='synergies'
    )

    category = db.relationship(
        'Category',
        back_populates='synergies'
    )

    comments = db.relationship(
        'Comment',
        back_populates='synergy',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    metrics = db.relationship(
        'SynergyMetric',
        backref='synergy',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    workflow_transitions = db.relationship(
        'WorkflowTransition',
        back_populates='synergy',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    # Constraints
    __table_args__ = (
        db.CheckConstraint('company1_id != company2_id', name='different_companies'),
        db.Index('idx_company_pair', 'company1_id', 'company2_id'),
    )

    def __repr__(self):
        return f'<Synergy {self.id}: {self.synergy_type}>'

    def to_dict(self, include_metrics=False):
        """Convert model to dictionary representation."""
        data = {
            'id': self.id,
            'company1_id': self.company1_id,
            'company2_id': self.company2_id,
            'synergy_type': self.synergy_type,
            'description': self.description,
            'value_low': self.value_low,
            'value_high': self.value_high,
            'estimated_value': self.estimated_value,
            'confidence_score': self.confidence_score,
            'status': self.status,
            'deal_id': self.deal_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_metrics:
            data['metrics'] = [metric.to_dict() for metric in self.metrics]

        return data


class SynergyMetric(db.Model):
    """
    Represents a quantitative metric associated with a synergy.
    
    Attributes:
        id: Unique identifier
        synergy_id: Foreign key to parent synergy
        metric_name: Name of the metric (e.g., 'cost_savings', 'revenue_increase')
        metric_value: Numerical value of the metric
        unit: Unit of measurement (e.g., 'USD', 'percentage')
        timeframe: Expected timeframe for realization
        created_at: Timestamp of creation
    """
    __tablename__ = 'synergy_metrics'

    id = db.Column(db.Integer, primary_key=True)
    synergy_id = db.Column(db.Integer, db.ForeignKey('synergies.id'), nullable=False, index=True)
    metric_name = db.Column(db.String(100), nullable=False, index=True)
    metric_value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    timeframe = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f'<SynergyMetric {self.metric_name}: {self.metric_value} {self.unit}>'

    def to_dict(self):
        """Convert model to dictionary representation."""
        return {
            'id': self.id,
            'synergy_id': self.synergy_id,
            'metric_name': self.metric_name,
            'metric_value': self.metric_value,
            'unit': self.unit,
            'timeframe': self.timeframe,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }