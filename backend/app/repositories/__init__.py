"""
Repository layer for database operations.

Implements repository pattern with base CRUD operations
and specialized domain queries.
"""

from backend.app.repositories.base import BaseRepository
from backend.app.repositories.industry import IndustryRepository
from backend.app.repositories.function import FunctionRepository
from backend.app.repositories.category import CategoryRepository
from backend.app.repositories.synergy import SynergyRepository
from backend.app.repositories.analytics import AnalyticsRepository

__all__ = [
    'BaseRepository',
    'IndustryRepository',
    'FunctionRepository',
    'CategoryRepository',
    'SynergyRepository',
    'AnalyticsRepository',
]