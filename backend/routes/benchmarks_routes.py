"""Benchmark dataset routes — comp set exploration and filtering."""
from flask import Blueprint, request, jsonify
from backend.app.models.lever import BenchmarkProject, BenchmarkDataPoint, SynergyLever
from backend.app.extensions import db
from backend.utils.auth_decorators import require_role
from sqlalchemy import func
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('benchmarks', __name__, url_prefix='/api/benchmarks')


@bp.route('', methods=['GET'])
@require_role('viewer', 'analyst', 'admin')
def get_benchmark_summary():
    """
    Return comp set summary + available filter options.

    Query Parameters (all optional — used to preview filtered count):
        industries: comma-separated industry names  e.g. "Technology,Healthcare"
        deal_size_min: minimum combined_revenue_usd (integer)
        deal_size_max: maximum combined_revenue_usd (integer)
        year_min: minimum close_year (integer)
        year_max: maximum close_year (integer)
    """
    try:
        # Parse optional filters for preview count
        industries_param = request.args.get('industries', '')
        deal_size_min = request.args.get('deal_size_min', type=int)
        deal_size_max = request.args.get('deal_size_max', type=int)
        year_min = request.args.get('year_min', type=int)
        year_max = request.args.get('year_max', type=int)
        industries = [i.strip() for i in industries_param.split(',') if i.strip()]

        # All projects (unfiltered)
        all_projects = BenchmarkProject.query.all()

        # Distinct industries
        industry_rows = db.session.query(
            BenchmarkProject.industry,
            func.count(BenchmarkProject.id).label('count')
        ).filter(
            BenchmarkProject.industry.isnot(None)
        ).group_by(BenchmarkProject.industry).all()

        available_industries = [
            {'name': row[0], 'count': row[1]}
            for row in sorted(industry_rows, key=lambda r: r[1], reverse=True)
        ]

        # Deal size range
        size_result = db.session.query(
            func.min(BenchmarkProject.combined_revenue_usd),
            func.max(BenchmarkProject.combined_revenue_usd)
        ).first()

        # Year range
        year_result = db.session.query(
            func.min(BenchmarkProject.close_year),
            func.max(BenchmarkProject.close_year)
        ).first()

        # Apply filters to preview filtered count
        filtered_query = BenchmarkProject.query
        if industries:
            filtered_query = filtered_query.filter(BenchmarkProject.industry.in_(industries))
        if deal_size_min is not None:
            filtered_query = filtered_query.filter(
                BenchmarkProject.combined_revenue_usd >= deal_size_min
            )
        if deal_size_max is not None:
            filtered_query = filtered_query.filter(
                BenchmarkProject.combined_revenue_usd <= deal_size_max
            )
        if year_min is not None:
            filtered_query = filtered_query.filter(BenchmarkProject.close_year >= year_min)
        if year_max is not None:
            filtered_query = filtered_query.filter(BenchmarkProject.close_year <= year_max)

        filtered_projects = filtered_query.all()

        return jsonify({
            'total_projects': len(all_projects),
            'filtered_count': len(filtered_projects),
            'available_industries': available_industries,
            'deal_size_range': {
                'min': size_result[0],
                'max': size_result[1],
            },
            'year_range': {
                'min': year_result[0],
                'max': year_result[1],
            },
            'projects': [p.to_dict() for p in all_projects],
            'filtered_projects': [p.to_dict() for p in filtered_projects],
        })

    except Exception as e:
        logger.error(f"Error fetching benchmark summary: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
