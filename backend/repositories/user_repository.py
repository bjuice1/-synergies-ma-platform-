"""Repository for User model database operations."""
from typing import Optional, List
from backend.app.models.user.user import User
from backend.extensions import db


class UserRepository:
    """Handle User database operations following Repository pattern."""
    
    @staticmethod
    def create(email: str, password: str, role: str = 'user') -> User:
        """Create a new user with hashed password.
        
        Args:
            email: User email address
            password: Plain text password (will be hashed)
            role: User role (default: 'user')
            
        Returns:
            User: Created user instance
        """
        user = User(email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user
    
    @staticmethod
    def get_by_id(user_id: int) -> Optional[User]:
        """Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User or None if not found
        """
        return User.query.filter_by(id=user_id).first()
    
    @staticmethod
    def get_by_email(email: str) -> Optional[User]:
        """Get user by email address.
        
        Args:
            email: Email address
            
        Returns:
            User or None if not found
        """
        return User.query.filter_by(email=email).first()
    
    @staticmethod
    def get_all(include_inactive: bool = False) -> List[User]:
        """Get all users.
        
        Args:
            include_inactive: Whether to include inactive users
            
        Returns:
            List of User instances
        """
        query = User.query
        if not include_inactive:
            query = query.filter_by(is_active=True)
        return query.order_by(User.created_at.desc()).all()
    
    @staticmethod
    def update(user: User, **kwargs) -> User:
        """Update user fields.
        
        Args:
            user: User instance to update
            **kwargs: Fields to update
            
        Returns:
            Updated user instance
        """
        for key, value in kwargs.items():
            if hasattr(user, key) and key != 'password_hash':
                setattr(user, key, value)
        db.session.commit()
        return user
    
    @staticmethod
    def update_password(user: User, new_password: str) -> User:
        """Update user password.
        
        Args:
            user: User instance
            new_password: New plain text password
            
        Returns:
            Updated user instance
        """
        user.set_password(new_password)
        db.session.commit()
        return user
    
    @staticmethod
    def soft_delete(user: User) -> User:
        """Soft delete user by marking as inactive.
        
        Args:
            user: User instance to delete
            
        Returns:
            Deleted user instance
        """
        user.is_active = False
        db.session.commit()
        return user
    
    @staticmethod
    def hard_delete(user: User) -> None:
        """Permanently delete user from database.
        
        Args:
            user: User instance to delete
        """
        db.session.delete(user)
        db.session.commit()
    
    @staticmethod
    def exists_by_email(email: str) -> bool:
        """Check if user exists with given email.

        Args:
            email: Email address to check

        Returns:
            True if user exists, False otherwise
        """
        return db.session.query(
            User.query.filter_by(email=email).exists()
        ).scalar()

    # Aliases for backwards compatibility with auth.py
    @staticmethod
    def email_exists(email: str) -> bool:
        """Check if email exists (alias for exists_by_email)."""
        return UserRepository.exists_by_email(email)

    @staticmethod
    def username_exists(username: str) -> bool:
        """Check if username exists.

        Note: User model uses email as primary identifier.
        This checks email field for backwards compatibility.
        """
        return UserRepository.exists_by_email(username)

    @staticmethod
    def find_by_username(username: str) -> Optional[User]:
        """Find user by username (uses email field)."""
        return UserRepository.get_by_email(username)

    @staticmethod
    def find_by_id(user_id: int) -> Optional[User]:
        """Find user by ID (alias for get_by_id)."""
        return UserRepository.get_by_id(user_id)

    @staticmethod
    def create_user(username: str, email: str, password: str, role: str = 'user') -> User:
        """Create user with username compatibility.

        Uses email as the primary identifier.
        """
        return UserRepository.create(email=email, password=password, role=role)