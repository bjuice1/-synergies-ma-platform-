"""API routes for synergy management."""
from flask import Blueprint, request, jsonify
from backend.repositories.synergy_repository import SynergyRepository
from backend.utils.auth_decorators import require_role

bp = Blueprint('synergies', __name__, url_prefix='/api/synergies')
# TODO: Fix repository instantiation - needs session
# synergy_repo = SynergyRepository()


@bp.route('', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_synergies():
    """
    Get all synergies with optional filtering.
    
    Query Parameters:
        source_entity_id: Filter by source entity
        target_entity_id: Filter by target entity
        synergy_type: Filter by type (cost, revenue, operational)
    
    Authorization:
        Roles: viewer, analyst, admin
    
    Returns:
        200: List of synergies
    """
    filters = {}
    
    if request.args.get('source_entity_id'):
        filters['source_entity_id'] = int(request.args.get('source_entity_id'))
    
    if request.args.get('target_entity_id'):
        filters['target_entity_id'] = int(request.args.get('target_entity_id'))
    
    if request.args.get('synergy_type'):
        filters['synergy_type'] = request.args.get('synergy_type')
    
    synergies = synergy_repo.find_by(**filters) if filters else synergy_repo.find_all()
    
    return jsonify([synergy.to_dict() for synergy in synergies]), 200


@bp.route('/<int:synergy_id>', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_synergy(synergy_id):
    """
    Get a single synergy by ID.
    
    Authorization:
        Roles: viewer, analyst, admin
    
    Returns:
        200: Synergy details
        404: Synergy not found
    """
    synergy = synergy_repo.find_by_id(synergy_id)
    
    if not synergy:
        return jsonify({'error': 'Synergy not found'}), 404
    
    return jsonify(synergy.to_dict()), 200


@bp.route('', methods=['POST'])
@require_role('analyst', 'admin')
def create_synergy():
    """
    Create a new synergy.
    
    Request Body:
        {
            "source_entity_id": 1,
            "target_entity_id": 2,
            "synergy_type": "cost",
            "value_low": 1000000,
            "value_high": 2000000,
            "description": "Synergy description",
            "realization_timeline": "12-18 months",
            "confidence_level": "medium"
        }
    
    Authorization:
        Roles: analyst, admin
    
    Returns:
        201: Created synergy
        400: Validation error
    """
    data = request.get_json()
    
    try:
        synergy = synergy_repo.create(data)
        return jsonify(synergy.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@bp.route('/<int:synergy_id>', methods=['PUT'])
@require_role('analyst', 'admin')
def update_synergy(synergy_id):
    """
    Update an existing synergy.
    
    Authorization:
        Roles: analyst, admin
    
    Returns:
        200: Updated synergy
        404: Synergy not found
        400: Validation error
    """
    data = request.get_json()
    
    try:
        synergy = synergy_repo.update(synergy_id, data)
        
        if not synergy:
            return jsonify({'error': 'Synergy not found'}), 404
        
        return jsonify(synergy.to_dict()), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@bp.route('/<int:synergy_id>', methods=['DELETE'])
@require_role('analyst', 'admin')
def delete_synergy(synergy_id):
    """
    Delete a synergy.
    
    Authorization:
        Roles: analyst, admin
    
    Returns:
        204: Successfully deleted
        404: Synergy not found
    """
    success = synergy_repo.delete(synergy_id)
    
    if not success:
        return jsonify({'error': 'Synergy not found'}), 404
    
    return '', 204