"""API routes for the lever playbook (learning section)."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from backend.app.models.lever import SynergyLever
from backend.app.models.playbook import LeverPlaybook
from backend.app.models.user import User
from backend.app.extensions import db
from backend.utils.auth_decorators import require_role
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('learn', __name__, url_prefix='/api/learn')


@bp.route('', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_all_playbooks():
    """
    Return all levers with their playbook content (if any).
    Used to populate the sidebar + initial content on /learn.
    """
    try:
        levers = SynergyLever.query.order_by(SynergyLever.sort_order).all()
        result = []
        for lever in levers:
            playbook = lever.playbook  # via backref on LeverPlaybook
            result.append({
                'lever_id': lever.id,
                'lever_name': lever.name,
                'lever_type': lever.lever_type,
                'sort_order': lever.sort_order,
                'description': lever.description,
                'playbook': playbook.to_dict() if playbook else None,
            })
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error fetching playbooks: {e}", exc_info=True)
        return jsonify({'error': 'Failed to fetch playbooks'}), 500


@bp.route('/<int:lever_id>', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_playbook(lever_id):
    """Return the playbook for a single lever."""
    try:
        lever = SynergyLever.query.get_or_404(lever_id)
        playbook = lever.playbook
        return jsonify({
            'lever_id': lever.id,
            'lever_name': lever.name,
            'lever_type': lever.lever_type,
            'description': lever.description,
            'playbook': playbook.to_dict() if playbook else None,
        }), 200
    except Exception as e:
        logger.error(f"Error fetching playbook {lever_id}: {e}", exc_info=True)
        return jsonify({'error': 'Failed to fetch playbook'}), 500


@bp.route('/<int:lever_id>', methods=['PUT'])
@require_role('analyst', 'admin')
def update_playbook(lever_id):
    """
    Create or update the playbook for a lever.
    Accepts any subset of fields — partial updates are fine.

    Body:
        what_it_is:          string
        what_drives_it:      string
        diligence_questions: list[string]
        red_flags:           list[string]
        team_notes:          string
    """
    try:
        lever = SynergyLever.query.get_or_404(lever_id)
        data = request.get_json(silent=True) or {}

        user_id = int(get_jwt_identity())

        playbook = lever.playbook
        if playbook is None:
            playbook = LeverPlaybook(lever_id=lever_id)
            db.session.add(playbook)

        # Apply only provided fields
        allowed = ['what_it_is', 'what_drives_it', 'diligence_questions', 'red_flags', 'team_notes']
        for field in allowed:
            if field in data:
                setattr(playbook, field, data[field])

        playbook.last_edited_by_id = user_id
        db.session.commit()

        return jsonify(playbook.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating playbook {lever_id}: {e}", exc_info=True)
        return jsonify({'error': 'Failed to update playbook'}), 500
