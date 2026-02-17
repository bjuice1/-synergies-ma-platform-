"""Authentication routes for user login and token management."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from backend.app.models.user import User
from backend.extensions import db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and return JWT tokens.
    
    Request Body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    
    Returns:
        200: {
            "access_token": "jwt_token",
            "refresh_token": "jwt_refresh_token",
            "user": {
                "id": 1,
                "email": "user@example.com",
                "name": "User Name",
                "role": "analyst"
            }
        }
        401: Invalid credentials
        400: Missing required fields
    """
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    # Verify password
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Create JWT tokens with role in additional claims
    access_token = create_access_token(
        identity=user.id,
        additional_claims={'role': user.role}  # Add role to JWT payload
    )
    refresh_token = create_refresh_token(
        identity=user.id,
        additional_claims={'role': user.role}
    )

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role
        }
    }), 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token.
    
    Headers:
        Authorization: Bearer <refresh_token>
    
    Returns:
        200: {"access_token": "new_jwt_token"}
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Create new access token with current role
    access_token = create_access_token(
        identity=current_user_id,
        additional_claims={'role': user.role.value}
    )
    
    return jsonify({'access_token': access_token}), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user information.
    
    Headers:
        Authorization: Bearer <access_token>
    
    Returns:
        200: {
            "id": 1,
            "email": "user@example.com",
            "name": "User Name",
            "role": "analyst"
        }
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role.value
    }), 200