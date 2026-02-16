"""
Activity feed model for tracking user actions
"""
from datetime import datetime
from backend.extensions import db


class Activity(db.Model):
    """Activity model for tracking user actions"""
    __tablename__ = 'activities'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)  # 'created', 'updated', 'deleted', 'commented', 'mentioned'
    resource_type = db.Column(db.String(50), nullable=False)  # 'synergy', 'comment', etc.
    resource_id = db.Column(db.Integer, nullable=False)
    meta_data = db.Column(db.JSON, nullable=True)  # Additional context (renamed from metadata - reserved name)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = db.relationship('User', back_populates='activities')
    
    __table_args__ = (
        db.Index('idx_activities_resource', 'resource_type', 'resource_id'),
        db.Index('idx_activities_user_created', 'user_id', 'created_at'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': {
                'id': self.user.id,
                'email': self.user.email,
                'name': getattr(self.user, 'name', None)
            } if self.user else None,
            'action_type': self.action_type,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'metadata': self.meta_data,  # Expose as metadata in API for backwards compatibility
            'created_at': self.created_at.isoformat() if self.created_at else None
        }