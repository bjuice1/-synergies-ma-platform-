from typing import Dict, List, Any
from sqlalchemy import func, case, extract
from sqlalchemy.orm import Session
from backend.app.models.synergy import Synergy
from backend.app.models.deal import Deal
from datetime import datetime


class AnalyticsRepository:
    """Repository for analytics aggregation queries."""
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def get_synergies_by_type(self) -> List[Dict[str, Any]]:
        """Aggregate synergy values by type."""
        results = (
            self.db.query(
                Synergy.synergy_type,
                func.sum(Synergy.estimated_value).label('total_value'),
                func.count(Synergy.id).label('count')
            )
            .group_by(Synergy.synergy_type)
            .all()
        )
        
        return [
            {
                'type': row.synergy_type,
                'total_value': float(row.total_value or 0),
                'count': row.count
            }
            for row in results
        ]
    
    def get_synergies_by_status(self) -> List[Dict[str, Any]]:
        """Aggregate synergy values by realization status."""
        results = (
            self.db.query(
                Synergy.realization_status,
                func.sum(Synergy.estimated_value).label('estimated_total'),
                func.sum(Synergy.realized_value).label('realized_total'),
                func.count(Synergy.id).label('count')
            )
            .group_by(Synergy.realization_status)
            .all()
        )
        
        return [
            {
                'status': row.realization_status,
                'estimated_total': float(row.estimated_total or 0),
                'realized_total': float(row.realized_total or 0),
                'count': row.count
            }
            for row in results
        ]
    
    def get_timeline_data(self) -> List[Dict[str, Any]]:
        """Get synergy realization timeline by quarter."""
        # Get planned timeline (target_realization_date)
        planned_results = (
            self.db.query(
                extract('year', Synergy.target_realization_date).label('year'),
                extract('quarter', Synergy.target_realization_date).label('quarter'),
                func.sum(Synergy.estimated_value).label('planned_value')
            )
            .filter(Synergy.target_realization_date.isnot(None))
            .group_by('year', 'quarter')
            .order_by('year', 'quarter')
            .all()
        )
        
        # Get actual realized timeline (actual_realization_date)
        actual_results = (
            self.db.query(
                extract('year', Synergy.actual_realization_date).label('year'),
                extract('quarter', Synergy.actual_realization_date).label('quarter'),
                func.sum(Synergy.realized_value).label('realized_value')
            )
            .filter(Synergy.actual_realization_date.isnot(None))
            .group_by('year', 'quarter')
            .order_by('year', 'quarter')
            .all()
        )
        
        # Merge planned and actual data
        timeline_dict = {}
        
        for row in planned_results:
            key = f"Q{int(row.quarter)} {int(row.year)}"
            timeline_dict[key] = {
                'period': key,
                'year': int(row.year),
                'quarter': int(row.quarter),
                'planned_value': float(row.planned_value or 0),
                'realized_value': 0.0
            }
        
        for row in actual_results:
            key = f"Q{int(row.quarter)} {int(row.year)}"
            if key not in timeline_dict:
                timeline_dict[key] = {
                    'period': key,
                    'year': int(row.year),
                    'quarter': int(row.quarter),
                    'planned_value': 0.0,
                    'realized_value': float(row.realized_value or 0)
                }
            else:
                timeline_dict[key]['realized_value'] = float(row.realized_value or 0)
        
        # Sort by year and quarter
        sorted_timeline = sorted(
            timeline_dict.values(),
            key=lambda x: (x['year'], x['quarter'])
        )
        
        return sorted_timeline
    
    def calculate_roi_metrics(self) -> Dict[str, Any]:
        """Calculate overall ROI metrics."""
        # Total estimated value
        total_estimated = (
            self.db.query(func.sum(Synergy.estimated_value))
            .scalar() or 0
        )
        
        # Total realized value
        total_realized = (
            self.db.query(func.sum(Synergy.realized_value))
            .scalar() or 0
        )
        
        # Total implementation cost
        total_cost = (
            self.db.query(func.sum(Synergy.implementation_cost))
            .scalar() or 0
        )
        
        # Count by status
        status_counts = (
            self.db.query(
                Synergy.realization_status,
                func.count(Synergy.id).label('count')
            )
            .group_by(Synergy.realization_status)
            .all()
        )
        
        status_breakdown = {row.realization_status: row.count for row in status_counts}
        total_synergies = sum(status_breakdown.values())
        
        # Calculate ROI percentage
        roi_percentage = 0.0
        if total_cost > 0:
            roi_percentage = ((total_realized - total_cost) / total_cost) * 100
        
        # Calculate realization rate
        realization_rate = 0.0
        if total_estimated > 0:
            realization_rate = (total_realized / total_estimated) * 100
        
        return {
            'total_estimated_value': round(float(total_estimated), 2),
            'total_realized_value': round(float(total_realized), 2),
            'total_implementation_cost': round(float(total_cost), 2),
            'roi_percentage': round(roi_percentage, 2),
            'realization_rate': round(realization_rate, 2),
            'total_synergies': total_synergies,
            'status_breakdown': status_breakdown
        }