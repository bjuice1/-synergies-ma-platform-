"""
Comment model for synergy collaboration
"""
from datetime import datetime
from backend.extensions import db


class Comment(db.Model):
    """Comment model for synergies"""
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    synergy_id = db.Column(db.Integer, db.ForeignKey('synergies.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    synergy = db.relationship('Synergy', back_populates='comments')
    user = db.relationship('User', back_populates='comments')
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]))
    mentions = db.relationship('Mention', back_populates='comment', cascade='all, delete-orphan')
    
    def to_dict(self, include_replies=False):
        """Convert to dictionary"""
        result = {
            'id': self.id,
            'content': self.content,
            'synergy_id': self.synergy_id,
            'user_id': self.user_id,
            'user': {
                'id': self.user.id,
                'email': self.user.email,
                'name': getattr(self.user, 'name', None)
            } if self.user else None,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
        }
        
        if include_replies and self.replies:
            result['replies'] = [reply.to_dict() for reply in self.replies if not reply.deleted_at]
        
        return result