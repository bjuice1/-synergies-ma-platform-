"""
DEPRECATED: This module is deprecated. Use backend.app.models instead.

This re-export layer provides temporary backwards compatibility.
All imports will be removed in a future version.

Migration guide:
  OLD: from backend.models import User
  NEW: from backend.app.models.user import User
  or:  from backend.app.models import User
"""
import warnings

warnings.warn(
    "backend.models is deprecated. Use backend.app.models instead.",
    DeprecationWarning,
    stacklevel=2
)

# Re-export from canonical location for backwards compatibility
from backend.app.models.user import User
from backend.app.models.synergy import Synergy
from backend.app.models.deal import Deal

__all__ = ['User', 'Synergy', 'Deal']
