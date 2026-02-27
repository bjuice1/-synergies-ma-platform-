"""
LeverPlaybook — the methodology workspace for each synergy lever.

One playbook per SynergyLever. Editable by analysts.
Structured fields so the chatbot can retrieve facts precisely.
"""

from backend.app.extensions import db
from datetime import datetime


class LeverPlaybook(db.Model):
    __tablename__ = 'lever_playbooks'

    id = db.Column(db.Integer, primary_key=True)
    lever_id = db.Column(db.Integer, db.ForeignKey('synergy_levers.id'), nullable=False, unique=True, index=True)

    # Structured content fields
    what_it_is = db.Column(db.Text, nullable=True)
    what_drives_it = db.Column(db.Text, nullable=True)
    diligence_questions = db.Column(db.JSON, nullable=True)   # list of strings
    red_flags = db.Column(db.JSON, nullable=True)             # list of strings
    team_notes = db.Column(db.Text, nullable=True)            # freeform, living content

    # Audit
    last_edited_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    lever = db.relationship('SynergyLever', backref=db.backref('playbook', uselist=False))
    last_edited_by = db.relationship('User', foreign_keys=[last_edited_by_id])

    def __repr__(self):
        return f'<LeverPlaybook lever_id={self.lever_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'lever_id': self.lever_id,
            'lever_name': self.lever.name if self.lever else None,
            'lever_type': self.lever.lever_type if self.lever else None,
            'what_it_is': self.what_it_is,
            'what_drives_it': self.what_drives_it,
            'diligence_questions': self.diligence_questions or [],
            'red_flags': self.red_flags or [],
            'team_notes': self.team_notes,
            'last_edited_by': self.last_edited_by.email if self.last_edited_by else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
