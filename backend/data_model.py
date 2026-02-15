"""
Data models for M&A Synergies Analysis

TODO: Implement the following classes based on PROJECT_SPEC.md:
- Synergy (main entity)
- Function (business function)
- Industry (industry vertical)
- SynergyExample (historical examples)

Database: SQLite
ORM: Can use SQLAlchemy or raw SQL
"""

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime


@dataclass
class Synergy:
    """
    Represents a potential synergy opportunity in M&A

    TODO: Complete implementation per PROJECT_SPEC.md
    """
    id: Optional[int] = None
    name: str = ""
    function: str = ""  # IT, HR, Finance, Sales, Operations, Legal, R&D
    synergy_type: str = ""  # Cost Reduction, Revenue Enhancement, Operational, Strategic
    industry: Optional[str] = None
    description: str = ""
    value_min: int = 0  # Minimum value estimate in dollars
    value_max: int = 0  # Maximum value estimate in dollars
    timeframe: str = ""  # e.g., "6-12 months"
    complexity: str = ""  # Low, Medium, High
    risk_level: str = ""  # Low, Medium, High
    examples: str = ""  # Historical examples
    sources: str = ""  # Citations
    created_at: Optional[datetime] = None


@dataclass
class Function:
    """Business function (IT, HR, Finance, etc.)"""
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    typical_synergies: str = ""


@dataclass
class Industry:
    """Industry vertical"""
    id: Optional[int] = None
    name: str = ""
    characteristics: str = ""
    common_synergies: str = ""


# TODO: Implement database operations
# - create_tables()
# - insert_synergy()
# - get_synergies(filters)
# - get_functions()
# - get_industries()
