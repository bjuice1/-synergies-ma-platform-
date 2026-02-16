"""
Mention model for @mentions in comments
"""
from datetime import datetime
from backend.extensions import db


class Mention(db.Model):
    """Mention model for tracking @mentions"""
    __tablename__ = 'mentions'
    
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=False)
    mentioned_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    read = db.Column(db.Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    comment = db.relationship('Comment', back_populates='mentions')
    mentioned_user = db.relationship('User', foreign_keys=[mentioned_user_id], back_populates='mentions_received')
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'comment_id': self.comment_id,
            'mentioned_user_id': self.mentioned_user_id,
            'created_by_id': self.created_by_id,
            'read': self.read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'comment': self.comment.to_dict() if self.comment else None
        }