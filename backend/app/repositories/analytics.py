"""
Analytics repository for data visualization queries.
Provides optimized aggregation queries for charts.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import func, extract, case
from sqlalchemy.orm import Session

from backend.app.models.synergy import Synergy
from backend.app.models.activity import Activity
from backend.app.models.industry import Industry
from backend.app.models.category import Category


class AnalyticsRepository:
    """Repository for analytics and visualization data."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_synergy_trends(
        self,
        days: int = 30,
        industry_id: Optional[int] = None,
        category_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get synergy creation/status trends over time.
        
        Args:
            days: Number of days to look back
            industry_id: Filter by industry
            category_id: Filter by category
            
        Returns:
            List of {date, total, approved, in_progress, draft}
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = self.db.query(
            func.date(Synergy.created_at).label('date'),
            func.count(Synergy.id).label('total'),
            func.sum(
                case((Synergy.status == 'approved', 1), else_=0)
            ).label('approved'),
            func.sum(
                case((Synergy.status == 'in_progress', 1), else_=0)
            ).label('in_progress'),
            func.sum(
                case((Synergy.status == 'draft', 1), else_=0)
            ).label('draft')
        ).filter(
            Synergy.created_at >= start_date
        )
        
        if industry_id:
            query = query.filter(Synergy.industry_id == industry_id)
        if category_id:
            query = query.filter(Synergy.category_id == category_id)
        
        query = query.group_by(func.date(Synergy.created_at))
        query = query.order_by(func.date(Synergy.created_at))
        
        results = query.all()
        
        return [
            {
                'date': row.date.isoformat(),
                'total': row.total,
                'approved': row.approved,
                'in_progress': row.in_progress,
                'draft': row.draft
            }
            for row in results
        ]
    
    def get_value_waterfall(
        self,
        industry_id: Optional[int] = None,
        category_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get waterfall chart data showing value progression.
        
        Args:
            industry_id: Filter by industry
            category_id: Filter by category
            
        Returns:
            {categories: [...], values: [...], cumulative: [...]}
        """
        query = self.db.query(
            Synergy.status,
            func.sum(Synergy.estimated_value).label('estimated'),
            func.sum(Synergy.realized_value).label('realized')
        )
        
        if industry_id:
            query = query.filter(Synergy.industry_id == industry_id)
        if category_id:
            query = query.filter(Synergy.category_id == category_id)
        
        query = query.group_by(Synergy.status)
        results = query.all()
        
        # Build waterfall structure
        categories = []
        values = []
        cumulative = []
        running_total = 0
        
        # Start with estimated value
        total_estimated = sum(row.estimated or 0 for row in results)
        categories.append('Estimated Value')
        values.append(total_estimated)
        running_total = total_estimated
        cumulative.append(running_total)
        
        # Add realized value changes by status
        status_order = [
            'draft',
            'in_progress',
            'approved'
        ]
        
        for status in status_order:
            row = next((r for r in results if r.status == status), None)
            if row and row.realized:
                delta = row.realized - (row.estimated or 0)
                categories.append(f'{status.value.title()} Delta')
                values.append(delta)
                running_total += delta
                cumulative.append(running_total)
        
        # Final realized value
        total_realized = sum(row.realized or 0 for row in results)
        categories.append('Realized Value')
        values.append(total_realized - running_total)
        cumulative.append(total_realized)
        
        return {
            'categories': categories,
            'values': values,
            'cumulative': cumulative
        }
    
    def get_activity_heatmap(
        self,
        days: int = 30,
        industry_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get activity heatmap showing action patterns.
        
        Args:
            days: Number of days to look back
            industry_id: Filter by industry
            
        Returns:
            {rows: [action_types], columns: [dates], values: [[counts]]}
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = self.db.query(
            Activity.action_type,
            func.date(Activity.created_at).label('date'),
            func.count(Activity.id).label('count')
        ).filter(
            Activity.created_at >= start_date
        )
        
        if industry_id:
            query = query.join(Synergy, Activity.resource_id == Synergy.id)
            query = query.filter(
                Activity.resource_type == 'synergy',
                Synergy.industry_id == industry_id
            )
        
        query = query.group_by(Activity.action_type, func.date(Activity.created_at))
        query = query.order_by(func.date(Activity.created_at))
        
        results = query.all()
        
        # Build matrix structure
        action_types = sorted(set(row.action_type for row in results))
        dates = sorted(set(row.date for row in results))
        
        # Initialize matrix with zeros
        values = [[0 for _ in dates] for _ in action_types]
        
        # Fill in actual values
        for row in results:
            action_idx = action_types.index(row.action_type)
            date_idx = dates.index(row.date)
            values[action_idx][date_idx] = row.count
        
        return {
            'rows': action_types,
            'columns': [d.isoformat() for d in dates],
            'values': values
        }
    
    def get_industry_distribution(self) -> List[Dict[str, Any]]:
        """
        Get synergy distribution by industry.
        
        Returns:
            List of {industry, count, total_value}
        """
        results = self.db.query(
            Industry.name,
            func.count(Synergy.id).label('count'),
            func.sum(Synergy.estimated_value).label('total_value')
        ).join(
            Synergy, Synergy.industry_id == Industry.id
        ).group_by(
            Industry.name
        ).order_by(
            func.count(Synergy.id).desc()
        ).all()
        
        return [
            {
                'industry': row.name,
                'count': row.count,
                'total_value': float(row.total_value or 0)
            }
            for row in results
        ]
    
    def get_category_distribution(
        self,
        industry_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get synergy distribution by category.
        
        Args:
            industry_id: Filter by industry
            
        Returns:
            List of {category, count, total_value}
        """
        query = self.db.query(
            Category.name,
            func.count(Synergy.id).label('count'),
            func.sum(Synergy.estimated_value).label('total_value')
        ).join(
            Synergy, Synergy.category_id == Category.id
        )
        
        if industry_id:
            query = query.filter(Synergy.industry_id == industry_id)
        
        query = query.group_by(Category.name)
        query = query.order_by(func.count(Synergy.id).desc())
        
        results = query.all()
        
        return [
            {
                'category': row.name,
                'count': row.count,
                'total_value': float(row.total_value or 0)
            }
            for row in results
        ]