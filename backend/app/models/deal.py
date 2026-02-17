"""
Deal model definition.
"""

from backend.app.extensions import db
from datetime import datetime


class Deal(db.Model):
    """
    Represents an M&A deal in the system.

    Attributes:
        id: Unique identifier
        name: Deal name (e.g., "TechCorp acquires DataViz")
        deal_type: Type of deal (acquisition, merger, jv, partnership)
        deal_size_usd: Deal size in USD
        close_date: Expected or actual close date
        strategic_rationale: Why this deal makes sense
        acquirer_id: Foreign key to acquiring company
        target_id: Foreign key to target company
        deal_briefing_document: Full text of uploaded document
        status: Current deal status (draft, active, closed, cancelled)
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
    """
    __tablename__ = 'deals'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    deal_type = db.Column(db.String(50), nullable=False, default='acquisition', index=True)
    deal_size_usd = db.Column(db.BigInteger)
    close_date = db.Column(db.Date)
    strategic_rationale = db.Column(db.Text)
    acquirer_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    target_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    deal_briefing_document = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='draft', index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    acquirer = db.relationship(
        'Company',
        foreign_keys=[acquirer_id],
        backref='deals_as_acquirer'
    )

    target = db.relationship(
        'Company',
        foreign_keys=[target_id],
        backref='deals_as_target'
    )

    synergies = db.relationship(
        'Synergy',
        backref='deal',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    # Constraints
    __table_args__ = (
        db.CheckConstraint('acquirer_id != target_id', name='different_deal_companies'),
    )

    def __repr__(self):
        return f'<Deal {self.name}>'

    def to_dict(self, include_synergies=False):
        """Convert model to dictionary representation."""
        result = {
            'id': self.id,
            'name': self.name,
            'deal_type': self.deal_type,
            'deal_size_usd': self.deal_size_usd,
            'close_date': self.close_date.isoformat() if self.close_date else None,
            'strategic_rationale': self.strategic_rationale,
            'acquirer_id': self.acquirer_id,
            'target_id': self.target_id,
            'acquirer': self.acquirer.to_dict() if self.acquirer else None,
            'target': self.target.to_dict() if self.target else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_synergies:
            synergies = list(self.synergies.all())  # Single query - cache result
            result['synergies'] = [s.to_dict() for s in synergies]
            result['synergies_count'] = len(synergies)
            # Calculate total value using correct fields
            result['total_value_low'] = sum(s.value_low or 0 for s in synergies)
            result['total_value_high'] = sum(s.value_high or 0 for s in synergies)

        return result
