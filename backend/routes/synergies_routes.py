"""API routes for synergy management."""
from flask import Blueprint, request, jsonify
from backend.app.models.synergy import Synergy
from backend.app.models.workflow import WorkflowTransition
from backend.utils.auth_decorators import require_role

bp = Blueprint('synergies', __name__, url_prefix='/api/synergies')


@bp.route('', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_synergies():
    """
    Get all synergies with optional filtering.

    Query Parameters:
        company1_id: Filter by first company
        company2_id: Filter by second company
        synergy_type: Filter by type (cost_reduction, revenue_enhancement, etc.)
        industry_id: Filter by industry
        status: Filter by status

    Authorization:
        Roles: viewer, analyst, admin

    Returns:
        200: List of synergies
    """
    query = Synergy.query

    # Apply filters
    if request.args.get('company1_id'):
        query = query.filter_by(company1_id=int(request.args.get('company1_id')))

    if request.args.get('company2_id'):
        query = query.filter_by(company2_id=int(request.args.get('company2_id')))

    if request.args.get('synergy_type'):
        query = query.filter_by(synergy_type=request.args.get('synergy_type'))

    if request.args.get('industry_id'):
        query = query.filter_by(industry_id=int(request.args.get('industry_id')))

    if request.args.get('status'):
        query = query.filter_by(status=request.args.get('status'))

    synergies = query.all()

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
    synergy = Synergy.query.get(synergy_id)

    if not synergy:
        return jsonify({'error': 'Synergy not found'}), 404

    return jsonify(synergy.to_dict(include_metrics=True)), 200


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


@bp.route('/<int:synergy_id>/workflow', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_synergy_workflow(synergy_id):
    """
    Get workflow transition history for a synergy.

    Returns the complete history of state changes for this synergy,
    including who made the change, when, and any comments.

    Authorization:
        Roles: viewer, analyst, admin

    Returns:
        200: List of workflow transitions
        404: Synergy not found

    Example Response:
        [
            {
                "id": 1,
                "synergy_id": 123,
                "from_state": "draft",
                "to_state": "review",
                "action": "submit",
                "user_id": 5,
                "user_email": "analyst@company.com",
                "comment": "Ready for review",
                "created_at": "2026-02-17T10:30:00Z"
            }
        ]
    """
    # Verify synergy exists
    synergy = Synergy.query.get(synergy_id)
    if not synergy:
        return jsonify({'error': 'Synergy not found'}), 404

    # Get all workflow transitions for this synergy, ordered by date
    transitions = WorkflowTransition.query.filter_by(
        synergy_id=synergy_id
    ).order_by(WorkflowTransition.created_at.asc()).all()

    # Format transitions for response
    result = []
    for transition in transitions:
        result.append({
            'id': transition.id,
            'synergy_id': transition.synergy_id,
            'from_state': transition.from_state.value if transition.from_state else None,
            'to_state': transition.to_state.value if transition.to_state else None,
            'action': transition.action.value if transition.action else None,
            'user_id': transition.user_id,
            'user_email': transition.user.email if transition.user else None,
            'comment': transition.comment,
            'created_at': transition.created_at.isoformat() if transition.created_at else None
        })

    return jsonify(result), 200


@bp.route('/<int:synergy_id>/metrics', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_synergy_metrics(synergy_id):
    """
    Get detailed value breakdown metrics for a synergy.

    Returns granular cost and revenue metrics that make up the
    synergy's estimated value, allowing users to see exactly how
    the estimate was calculated.

    Authorization:
        Roles: viewer, analyst, admin

    Returns:
        200: List of metrics with categories
        404: Synergy not found

    Example Response:
        {
            "synergy_id": 123,
            "total_value_low": 5000000,
            "total_value_high": 8000000,
            "metrics": [
                {
                    "id": 1,
                    "category": "IT Costs",
                    "line_item": "Server Consolidation",
                    "value": 2000000,
                    "unit": "USD/year",
                    "description": "AWS vs on-prem savings",
                    "confidence": "high",
                    "assumption": "40% server overlap",
                    "data_source": "IT Infrastructure Audit Q4 2025"
                }
            ]
        }
    """
    synergy = Synergy.query.get(synergy_id)

    if not synergy:
        return jsonify({'error': 'Synergy not found'}), 404

    # Get metrics (using the relationship)
    metrics_list = []
    for metric in synergy.metrics:
        metrics_list.append({
            'id': metric.id,
            'synergy_id': metric.synergy_id,
            'metric_type': getattr(metric, 'metric_type', None),
            'category': getattr(metric, 'category', None),
            'line_item': getattr(metric, 'line_item', None),
            'value': getattr(metric, 'value', None),
            'unit': getattr(metric, 'unit', None),
            'description': getattr(metric, 'description', None),
            'confidence': getattr(metric, 'confidence', None),
            'assumption': getattr(metric, 'assumption', None),
            'data_source': getattr(metric, 'data_source', None),
            'created_at': metric.created_at.isoformat() if hasattr(metric, 'created_at') and metric.created_at else None
        })

    response = {
        'synergy_id': synergy.id,
        'total_value_low': synergy.estimated_value if hasattr(synergy, 'estimated_value') else None,
        'total_value_high': synergy.estimated_value if hasattr(synergy, 'estimated_value') else None,
        'metrics': metrics_list
    }

    return jsonify(response), 200