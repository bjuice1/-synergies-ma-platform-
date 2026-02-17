"""
Centralized model exports for consistent absolute imports.
All models should be imported from this module using: from app.models import ModelName
"""
from backend.app.models.user import User
from backend.app.models.organization import Organization
from backend.app.models.assessment import Assessment, AssessmentQuestion, AssessmentResponse
from backend.app.models.learning_path import LearningPath, LearningPathItem
from backend.app.models.resource import Resource
from backend.app.models.company import Company
from backend.app.models.deal import Deal
from backend.app.models.synergy import Synergy, SynergyMetric
from backend.app.models.industry import Industry

__all__ = [
    'User',
    'Organization',
    'Assessment',
    'AssessmentQuestion',
    'AssessmentResponse',
    'LearningPath',
    'LearningPathItem',
    'Resource',
    'Company',
    'Deal',
    'Synergy',
    'SynergyMetric',
    'Industry',
]