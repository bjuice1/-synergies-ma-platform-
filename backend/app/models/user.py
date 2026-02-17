"""User model with organization relationships."""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.extensions import db


class User(db.Model):
    """User account model."""
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships - use string references to avoid circular imports
    organization = db.relationship('Organization', back_populates='users')
    assessments = db.relationship('Assessment', back_populates='user', lazy='dynamic')
    learning_paths = db.relationship('LearningPath', back_populates='user', lazy='dynamic')
    activities = db.relationship('Activity', back_populates='user', lazy='dynamic')
    comments = db.relationship('Comment', back_populates='user', lazy='dynamic')
    mentions_received = db.relationship('Mention', foreign_keys='Mention.mentioned_user_id', back_populates='mentioned_user', lazy='dynamic')

    def set_password(self, password):
        """Hash and set user password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify password against hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Serialize user to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'organization_id': self.organization_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<User {self.email}>'