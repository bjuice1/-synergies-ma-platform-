"""
Company model definition.
"""

from backend.app.extensions import db
from datetime import datetime


class Company(db.Model):
    """
    Represents a company in the system.
    
    Attributes:
        id: Unique identifier
        name: Company name
        industry: Industry sector
        description: Company description
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
    """
    __tablename__ = 'companies'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True, index=True)
    industry = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    revenue_usd = db.Column(db.BigInteger)  # Annual revenue in USD
    employees = db.Column(db.Integer)
    geography = db.Column(db.JSON)  # JSON array: ["North America", "Europe"]
    products = db.Column(db.JSON)  # JSON array: ["Enterprise CRM", "Analytics"]
    tech_stack = db.Column(db.JSON)  # JSON array: ["AWS", "Kubernetes", "React"]
    strengths = db.Column(db.JSON)  # JSON array: ["Enterprise sales", "Customer base"]
    weaknesses = db.Column(db.JSON)  # JSON array: ["Analytics capabilities", "SMB market"]
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    synergies_as_company1 = db.relationship(
        'Synergy',
        foreign_keys='Synergy.company1_id',
        backref='company1',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    synergies_as_company2 = db.relationship(
        'Synergy',
        foreign_keys='Synergy.company2_id',
        backref='company2',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<Company {self.name}>'

    def to_dict(self):
        """Convert model to dictionary representation."""
        return {
            'id': self.id,
            'name': self.name,
            'industry': self.industry,
            'description': self.description,
            'revenue_usd': self.revenue_usd,
            'employees': self.employees,
            'geography': self.geography or [],
            'products': self.products or [],
            'tech_stack': self.tech_stack or [],
            'strengths': self.strengths or [],
            'weaknesses': self.weaknesses or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }