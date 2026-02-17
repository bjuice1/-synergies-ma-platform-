"""Custom exceptions for better error handling."""


class ValidationError(Exception):
    """Raised when request data is invalid."""
    pass


class NotFoundError(Exception):
    """Raised when a requested resource doesn't exist."""
    pass
