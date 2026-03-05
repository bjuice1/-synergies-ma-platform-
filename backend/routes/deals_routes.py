"""API routes for deal management."""
from flask import Blueprint, request, jsonify
from backend.app.models.deal import Deal
from backend.app.models.company import Company
from backend.app.models.synergy import Synergy
from backend.app.models.lever import DealLever, SynergyLever, BenchmarkDataPoint
from backend.app.services import synergy_generator  # Direct import to avoid __init__ cascade
from backend.app.extensions import db
from backend.utils.auth_decorators import require_role
from backend.utils.exceptions import ValidationError, NotFoundError
from datetime import datetime
from sqlalchemy import func
import logging

logger = logging.getLogger(__name__)

def auto_generate_deal_levers(deal, acquirer, target):
    """
    Auto-generate DealLever rows for a new deal using benchmark averages.

    Uses all BenchmarkDataPoints to compute pct_low = min, pct_high = max,
    pct_median = mean for each lever. calculated_value = combined_revenue * pct / 100.

    Revenue lever is skipped if no datapoints exist.
    Never raises — lever gen failure must not break deal creation.
    """
    try:
        combined_revenue = 0
        if acquirer and acquirer.revenue_usd:
            combined_revenue += acquirer.revenue_usd
        if target and target.revenue_usd:
            combined_revenue += target.revenue_usd

        levers = SynergyLever.query.order_by(SynergyLever.sort_order).all()
        benchmark_n_result = db.session.query(
            func.count(db.distinct(BenchmarkDataPoint.project_id))
        ).scalar() or 0

        created = 0
        for lever in levers:
            existing = DealLever.query.filter_by(deal_id=deal.id, lever_id=lever.id).first()
            if existing:
                continue

            pct_values = [
                row[0] for row in
                db.session.query(BenchmarkDataPoint.synergy_pct)
                .filter(BenchmarkDataPoint.lever_id == lever.id)
                .all()
            ]

            if not pct_values:
                continue

            pct_sorted = sorted(pct_values)
            pct_low = round(pct_sorted[0], 2)
            pct_high = round(pct_sorted[-1], 2)
            pct_median = round(sum(pct_sorted) / len(pct_sorted), 2)

            dl = DealLever(
                deal_id=deal.id,
                lever_id=lever.id,
                benchmark_pct_low=pct_low,
                benchmark_pct_high=pct_high,
                benchmark_pct_median=pct_median,
                benchmark_n=benchmark_n_result,
                combined_baseline_usd=None,
                calculated_value_low=int(combined_revenue * pct_low / 100) if combined_revenue else None,
                calculated_value_high=int(combined_revenue * pct_high / 100) if combined_revenue else None,
                status='identified',
                confidence='medium',
                advisor_notes=None,
            )
            db.session.add(dl)
            created += 1

        if created > 0:
            db.session.flush()
            logger.info(f"Auto-generated {created} DealLevers for deal {deal.id}")

    except Exception as e:
        logger.error(f"Failed to auto-generate levers for deal {deal.id}: {e}", exc_info=True)


bp = Blueprint('deals', __name__, url_prefix='/api/deals')


@bp.route('', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_deals():
    """
    Get all deals with optional filtering.

    Query Parameters:
        status: Filter by status (draft, active, closed, cancelled)
        acquirer_id: Filter by acquiring company
        target_id: Filter by target company
    """
    try:
        # Get query parameters
        status = request.args.get('status')
        acquirer_id = request.args.get('acquirer_id', type=int)
        target_id = request.args.get('target_id', type=int)

        # Build query
        query = Deal.query

        if status:
            query = query.filter(Deal.status == status)
        if acquirer_id:
            query = query.filter(Deal.acquirer_id == acquirer_id)
        if target_id:
            query = query.filter(Deal.target_id == target_id)

        # Order by most recent first
        deals = query.order_by(Deal.created_at.desc()).all()

        return jsonify([deal.to_dict(include_synergies=True) for deal in deals]), 200

    except Exception as e:
        logger.error(f"Error fetching deals: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/<int:deal_id>', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_deal(deal_id):
    """Get a specific deal by ID."""
    try:
        deal = Deal.query.get_or_404(deal_id)
        return jsonify(deal.to_dict(include_synergies=True)), 200
    except NotFoundError as e:
        return jsonify({'error': 'Deal not found'}), 404
    except Exception as e:
        logger.error(f"Error fetching deal {deal_id}: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('', methods=['POST'])
@require_role('analyst', 'admin')
def create_deal():
    """
    Create a new deal.

    Request Body:
        name: Deal name (required)
        deal_type: Type of deal (acquisition, merger, jv, partnership)
        deal_size_usd: Deal size in USD
        close_date: Expected close date (ISO format)
        strategic_rationale: Why this deal makes sense
        acquirer: Acquirer company details (new or existing)
        target: Target company details (new or existing)
    """
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Deal name is required'}), 400
        if not data.get('acquirer'):
            return jsonify({'error': 'Acquirer company details are required'}), 400
        if not data.get('target'):
            return jsonify({'error': 'Target company details are required'}), 400

        # Create or get acquirer company
        acquirer_data = data['acquirer']
        if acquirer_data.get('id'):
            acquirer = Company.query.get(acquirer_data['id'])
            if not acquirer:
                return jsonify({'error': 'Acquirer company not found'}), 404
        else:
            # Create new acquirer company
            acquirer = Company(
                name=acquirer_data.get('name'),
                industry=acquirer_data.get('industry', 'Unknown'),
                description=acquirer_data.get('description'),
                revenue_usd=acquirer_data.get('revenue_usd'),
                employees=acquirer_data.get('employees'),
                geography=acquirer_data.get('geography', []),
                products=acquirer_data.get('products', []),
                tech_stack=acquirer_data.get('tech_stack', []),
                strengths=acquirer_data.get('strengths', []),
                weaknesses=acquirer_data.get('weaknesses', [])
            )
            db.session.add(acquirer)
            db.session.flush()  # Get acquirer ID

        # Create or get target company
        target_data = data['target']
        if target_data.get('id'):
            target = Company.query.get(target_data['id'])
            if not target:
                return jsonify({'error': 'Target company not found'}), 404
        else:
            # Create new target company
            target = Company(
                name=target_data.get('name'),
                industry=target_data.get('industry', 'Unknown'),
                description=target_data.get('description'),
                revenue_usd=target_data.get('revenue_usd'),
                employees=target_data.get('employees'),
                geography=target_data.get('geography', []),
                products=target_data.get('products', []),
                tech_stack=target_data.get('tech_stack', []),
                strengths=target_data.get('strengths', []),
                weaknesses=target_data.get('weaknesses', [])
            )
            db.session.add(target)
            db.session.flush()  # Get target ID

        # Parse close_date if provided
        close_date = None
        if data.get('close_date'):
            try:
                close_date = datetime.fromisoformat(data['close_date'].replace('Z', '+00:00')).date()
            except ValueError:
                return jsonify({'error': 'Invalid close_date format. Use ISO 8601 (YYYY-MM-DD)'}), 400

        # Create deal
        deal = Deal(
            name=data['name'],
            deal_type=data.get('deal_type', 'acquisition'),
            deal_size_usd=data.get('deal_size_usd'),
            close_date=close_date,
            strategic_rationale=data.get('strategic_rationale'),
            acquirer_id=acquirer.id,
            target_id=target.id,
            deal_briefing_document=data.get('deal_briefing_document'),
            status='draft'
        )

        db.session.add(deal)
        db.session.flush()  # Get deal ID before lever generation
        auto_generate_deal_levers(deal, acquirer, target)
        db.session.commit()

        return jsonify(deal.to_dict()), 201

    except ValidationError as e:
        db.session.rollback()
        logger.warning(f"Validation error creating deal: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating deal: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/<int:deal_id>', methods=['PUT'])
@require_role('analyst', 'admin')
def update_deal(deal_id):
    """Update an existing deal."""
    try:
        deal = Deal.query.get_or_404(deal_id)
        data = request.get_json()

        # Update fields
        if 'name' in data:
            deal.name = data['name']
        if 'deal_type' in data:
            deal.deal_type = data['deal_type']
        if 'deal_size_usd' in data:
            deal.deal_size_usd = data['deal_size_usd']
        if 'close_date' in data:
            if data['close_date']:
                deal.close_date = datetime.fromisoformat(data['close_date'].replace('Z', '+00:00')).date()
            else:
                deal.close_date = None
        if 'strategic_rationale' in data:
            deal.strategic_rationale = data['strategic_rationale']
        if 'status' in data:
            deal.status = data['status']
        if 'deal_briefing_document' in data:
            deal.deal_briefing_document = data['deal_briefing_document']

        db.session.commit()

        return jsonify(deal.to_dict(include_synergies=True)), 200

    except ValidationError as e:
        db.session.rollback()
        logger.warning(f"Validation error updating deal {deal_id}: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating deal {deal_id}: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/<int:deal_id>', methods=['DELETE'])
@require_role('admin')
def delete_deal(deal_id):
    """Delete a deal and all associated synergies."""
    try:
        deal = Deal.query.get_or_404(deal_id)
        db.session.delete(deal)
        db.session.commit()

        return jsonify({'message': 'Deal deleted successfully'}), 200

    except NotFoundError as e:
        return jsonify({'error': 'Deal not found'}), 404
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting deal {deal_id}: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/<int:deal_id>/levers', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_deal_levers(deal_id):
    """
    Get all synergy levers for a deal, including benchmark data,
    cost baselines, calculated opportunity ranges, and activities.
    This is the primary view for deal synergy analysis.
    """
    try:
        deal = Deal.query.get_or_404(deal_id)
        deal_levers = (
            DealLever.query
            .filter_by(deal_id=deal_id)
            .join(SynergyLever)
            .order_by(SynergyLever.sort_order)
            .all()
        )

        result = []
        for dl in deal_levers:
            lever_data = dl.to_dict()
            # Include activities (specific synergy items under this lever)
            activities = Synergy.query.filter_by(deal_lever_id=dl.id).all()
            lever_data['activities'] = [
                {
                    'id': a.id,
                    'synergy_type': a.synergy_type,
                    'description': a.description,
                    'value_low': a.value_low,
                    'value_high': a.value_high,
                    'status': a.status,
                    'confidence_score': a.confidence_score,
                }
                for a in activities
            ]
            result.append(lever_data)

        # Summary totals
        cost_levers = [dl for dl in deal_levers if dl.lever and dl.lever.lever_type == 'cost']
        total_low = sum(dl.calculated_value_low or 0 for dl in cost_levers)
        total_high = sum(dl.calculated_value_high or 0 for dl in cost_levers)
        combined_revenue = (deal.acquirer.revenue_usd or 0) + (deal.target.revenue_usd or 0) if deal.acquirer and deal.target else 0

        return jsonify({
            'deal_id': deal_id,
            'levers': result,
            'summary': {
                'total_cost_synergy_low': total_low,
                'total_cost_synergy_high': total_high,
                'combined_revenue': combined_revenue,
                'total_pct_low': round(total_low / combined_revenue * 100, 1) if combined_revenue else None,
                'total_pct_high': round(total_high / combined_revenue * 100, 1) if combined_revenue else None,
                'benchmark_n': deal_levers[0].benchmark_n if deal_levers else 0,
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching levers for deal {deal_id}: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/<int:deal_id>/generate-synergies', methods=['POST'])
@require_role('analyst', 'admin')
def generate_synergies(deal_id):
    """
    Generate synergies for a deal using AI/rules.

    This endpoint analyzes the deal context and creates potential synergies.
    Phase 1: Simple rule-based patterns.
    Future: LLM-powered analysis.
    """
    try:
        deal = Deal.query.get_or_404(deal_id)

        # Check if synergies already exist (idempotency)
        existing_count = deal.synergies.count()
        if existing_count > 0:
            return jsonify({
                'message': f'Deal already has {existing_count} synergies. Delete them first to regenerate.',
                'synergies': [s.to_dict() for s in deal.synergies.all()]
            }), 200

        # Get acquirer and target companies
        acquirer = deal.acquirer
        target = deal.target

        if not acquirer or not target:
            return jsonify({'error': 'Deal must have both acquirer and target companies'}), 400

        # Generate synergies using service
        synergy_dicts = synergy_generator.generate_synergies_for_deal(deal, acquirer, target)

        # Create synergy records
        created_synergies = []
        for synergy_data in synergy_dicts:
            synergy = Synergy(**synergy_data)
            db.session.add(synergy)
            created_synergies.append(synergy)

        db.session.commit()

        return jsonify({
            'message': f'Generated {len(created_synergies)} synergies',
            'synergies': [s.to_dict() for s in created_synergies]
        }), 201

    except ValidationError as e:
        db.session.rollback()
        logger.warning(f"Validation error generating synergies for deal {deal_id}: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error generating synergies for deal {deal_id}: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500
