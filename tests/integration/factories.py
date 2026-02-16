from datetime import datetime, timedelta
from backend.app.models import Synergy, Deal, Assumption, Widget, Visualization
from faker import Faker
fake = Faker()

class SynergyFactory:
    """Factory for creating test synergies"""

    @staticmethod
    def create(db, user, **kwargs):
        defaults = {'name': fake.catch_phrase(), 'description': fake.text(max_nb_chars=200), 'category': fake.random_element(['cost', 'revenue', 'operational']), 'status': 'identified', 'priority': 'medium', 'estimated_value': fake.pydecimal(left_digits=6, right_digits=2, positive=True), 'confidence_level': fake.pydecimal(left_digits=2, right_digits=0, positive=True, min_value=50, max_value=95), 'user_id': user.id}
        defaults.update(kwargs)
        synergy = Synergy(**defaults)
        db.session.add(synergy)
        db.session.commit()
        return synergy

class DealFactory:
    """Factory for creating test deals"""

    @staticmethod
    def create(db, user, **kwargs):
        defaults = {'name': f'{fake.company()} Acquisition', 'status': 'active', 'target_company': fake.company(), 'deal_value': fake.pydecimal(left_digits=8, right_digits=2, positive=True), 'expected_close_date': fake.date_between(start_date='today', end_date='+1y'), 'user_id': user.id}
        defaults.update(kwargs)
        deal = Deal(**defaults)
        db.session.add(deal)
        db.session.commit()
        return deal

class AssumptionFactory:
    """Factory for creating test assumptions"""

    @staticmethod
    def create(db, deal, **kwargs):
        defaults = {'name': fake.bs(), 'description': fake.text(max_nb_chars=150), 'category': fake.random_element(['financial', 'operational', 'market', 'regulatory']), 'value': fake.pydecimal(left_digits=5, right_digits=2, positive=True), 'unit': fake.random_element(['USD', 'percent', 'units', 'days']), 'confidence': fake.pydecimal(left_digits=2, right_digits=0, positive=True, min_value=60, max_value=95), 'deal_id': deal.id}
        defaults.update(kwargs)
        assumption = Assumption(**defaults)
        db.session.add(assumption)
        db.session.commit()
        return assumption

class WidgetFactory:
    """Factory for creating test widgets"""

    @staticmethod
    def create(db, user, widget_type='DataTable', **kwargs):
        defaults = {'name': fake.catch_phrase(), 'type': widget_type, 'user_id': user.id}
        defaults.update(kwargs)
        widget = Widget(**defaults)
        db.session.add(widget)
        db.session.commit()
        return widget

class VisualizationFactory:
    """Factory for creating test visualizations"""

    @staticmethod
    def create(db, user, **kwargs):
        defaults = {'name': fake.catch_phrase(), 'type': fake.random_element(['bar', 'line', 'pie', 'scatter']), 'config': {'x_axis': 'category', 'y_axis': 'value', 'color_scheme': 'default'}, 'user_id': user.id}
        defaults.update(kwargs)
        visualization = Visualization(**defaults)
        db.session.add(visualization)
        db.session.commit()
        return visualization