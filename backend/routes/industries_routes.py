"""API routes for industry management."""
from flask import Blueprint, request, jsonify
from backend.app.repositories.industry import IndustryRepository
from backend.utils.auth_decorators import require_role

bp = Blueprint('industries', __name__, url_prefix='/api/industries')
# TODO: Fix repository instantiation - needs session
# industry_repo = IndustryRepository()


@bp.route('', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_industries():
    """
    Get all industries.
    
    Authorization:
        Roles: viewer, analyst, admin
    
    Returns:
        200: List of industries
    """
    industries = industry_repo.find_all()
    return jsonify([industry.to_dict() for industry in industries]), 200


@bp.route('/<int:industry_id>', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_industry(industry_id):
    """
    Get a single industry by ID.
    
    Authorization:
        Roles: viewer, analyst, admin
    
    Returns:
        200: Industry details
        404: Industry not found
    """
    industry = industry_repo.find_by_id(industry_id)
    
    if not industry:
        return jsonify({'error': 'Industry not found'}), 404
    
    return jsonify(industry.to_dict()), 200


@bp.route('', methods=['POST'])
@require_role('analyst', 'admin')
def create_industry():
    """
    Create a new industry.
    
    Request Body:
        {
            "name": "Technology",
            "description": "Tech sector description"
        }
    
    Authorization:
        Roles: analyst, admin
    
    Returns:
        201: Created industry
        400: Validation error
    """
    data = request.get_json()
    
    try:
        industry = industry_repo.create(data)
        return jsonify(industry.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@bp.route('/<int:industry_id>', methods=['PUT'])
@require_role('analyst', 'admin')
def update_industry(industry_id):
    """
    Update an existing industry.
    
    Authorization:
        Roles: analyst, admin
    
    Returns:
        200: Updated industry
        404: Industry not found
        400: Validation error
    """
    data = request.get_json()
    
    try:
        industry = industry_repo.update(industry_id, data)
        
        if not industry:
            return jsonify({'error': 'Industry not found'}), 404
        
        return jsonify(industry.to_dict()), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@bp.route('/<int:industry_id>', methods=['DELETE'])
@require_role('analyst', 'admin')
def delete_industry(industry_id):
    """
    Delete an industry.
    
    Authorization:
        Roles: analyst, admin
    
    Returns:
        204: Successfully deleted
        404: Industry not found
        400: Cannot delete (has dependencies)
    """
    try:
        success = industry_repo.delete(industry_id)
        
        if not success:
            return jsonify({'error': 'Industry not found'}), 404
        
        return '', 204
    except ValueError as e:
        return jsonify({'error': str(e)}), 400