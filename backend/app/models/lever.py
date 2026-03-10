"""
Synergy lever models — the benchmarking and lever-first architecture.

Data flow:
  BenchmarkProject (comparable deals from APQC or internal data)
    → BenchmarkDataPoint (project × lever × %)
  SynergyLever (the functional buckets: IT, Finance, HR, Ops, Procurement, Real Estate)
  Deal
    → DealCostBaseline (client's actual $ spend per function, per company)
    → DealLever (output: benchmark % range × baseline cost = $ synergy opportunity)
      → Synergy activities (the specific "what to do" items)
"""

from backend.app.extensions import db
from datetime import datetime


class SynergyLever(db.Model):
    """
    A functional bucket / synergy lever category.
    These are the column headers in APQC benchmarking data.
    e.g. IT, Finance, HR, Operations, Procurement, Real Estate
    """
    __tablename__ = 'synergy_levers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)   # "IT", "Finance", etc.
    description = db.Column(db.Text, nullable=True)
    lever_type = db.Column(db.String(20), nullable=False, default='cost')  # 'cost' or 'revenue'
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    benchmark_datapoints = db.relationship(
        'BenchmarkDataPoint',
        back_populates='lever',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    deal_levers = db.relationship(
        'DealLever',
        back_populates='lever',
        lazy='dynamic'
    )
    cost_baselines = db.relationship(
        'DealCostBaseline',
        back_populates='lever',
        lazy='dynamic'
    )

    def __repr__(self):
        return f'<SynergyLever {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'lever_type': self.lever_type,
            'sort_order': self.sort_order,
        }


class BenchmarkProject(db.Model):
    """
    A comparable M&A deal used as a benchmarking reference.
    Each row in the APQC dataset becomes one BenchmarkProject.
    """
    __tablename__ = 'benchmark_projects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)          # e.g. "Project Atlas"
    deal_size_usd = db.Column(db.BigInteger, nullable=True)   # Enterprise value
    combined_revenue_usd = db.Column(db.BigInteger, nullable=True)
    industry = db.Column(db.String(100), nullable=True)       # "Technology", "Healthcare", etc.
    deal_type = db.Column(db.String(50), nullable=True)       # "acquisition", "merger"
    close_year = db.Column(db.Integer, nullable=True)
    total_synergy_pct = db.Column(db.Float, nullable=True)    # Total % of combined revenue
    source = db.Column(db.String(100), nullable=True)         # "APQC", "internal", etc.
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    datapoints = db.relationship(
        'BenchmarkDataPoint',
        back_populates='project',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<BenchmarkProject {self.name}>'

    def to_dict(self, include_datapoints=False):
        data = {
            'id': self.id,
            'name': self.name,
            'deal_size_usd': self.deal_size_usd,
            'combined_revenue_usd': self.combined_revenue_usd,
            'industry': self.industry,
            'deal_type': self.deal_type,
            'close_year': self.close_year,
            'total_synergy_pct': self.total_synergy_pct,
            'source': self.source,
        }
        if include_datapoints:
            data['datapoints'] = [dp.to_dict() for dp in self.datapoints]
        return data


class BenchmarkDataPoint(db.Model):
    """
    The intersection: one comparable deal × one lever × observed synergy %.
    synergy_pct is expressed as % of combined revenue.
    e.g. Project Atlas, IT lever, 1.8% → IT synergies were 1.8% of combined revenue.
    """
    __tablename__ = 'benchmark_datapoints'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('benchmark_projects.id'), nullable=False, index=True)
    lever_id = db.Column(db.Integer, db.ForeignKey('synergy_levers.id'), nullable=False, index=True)
    synergy_pct = db.Column(db.Float, nullable=False)   # % of combined revenue realized as synergy
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    project = db.relationship('BenchmarkProject', back_populates='datapoints')
    lever = db.relationship('SynergyLever', back_populates='benchmark_datapoints')

    def __repr__(self):
        return f'<BenchmarkDataPoint project={self.project_id} lever={self.lever_id} {self.synergy_pct}%>'

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'lever_id': self.lever_id,
            'lever_name': self.lever.name if self.lever else None,
            'synergy_pct': self.synergy_pct,
            'notes': self.notes,
        }


class DealCostBaseline(db.Model):
    """
    The client's actual cost/spend for a functional area, per company in the deal.
    This is the financial data the client provides — costs by function.
    The benchmark % is applied to the *combined* baseline to get the $ synergy opportunity.
    """
    __tablename__ = 'deal_cost_baselines'

    id = db.Column(db.Integer, primary_key=True)
    deal_id = db.Column(db.Integer, db.ForeignKey('deals.id'), nullable=False, index=True)
    lever_id = db.Column(db.Integer, db.ForeignKey('synergy_levers.id'), nullable=False, index=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True, index=True)
    company_role = db.Column(db.String(20), nullable=True)   # 'acquirer', 'target', 'combined'
    annual_cost_usd = db.Column(db.BigInteger, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    deal = db.relationship('Deal', back_populates='cost_baselines')
    lever = db.relationship('SynergyLever', back_populates='cost_baselines')
    company = db.relationship('Company')

    def __repr__(self):
        return f'<DealCostBaseline deal={self.deal_id} lever={self.lever_id} ${self.annual_cost_usd:,}>'

    def to_dict(self):
        return {
            'id': self.id,
            'deal_id': self.deal_id,
            'lever_id': self.lever_id,
            'lever_name': self.lever.name if self.lever else None,
            'company_id': self.company_id,
            'company_role': self.company_role,
            'annual_cost_usd': self.annual_cost_usd,
            'notes': self.notes,
        }


class DealLever(db.Model):
    """
    The synergy opportunity for one lever in one deal.
    Derived from: benchmark % range × combined cost baseline = $ opportunity range.

    This is the primary output of the platform for each deal:
    "Based on N comparable deals, IT synergies benchmark at X–Y% of combined revenue.
     Your combined IT spend is $Z. That implies $A–$B in synergy opportunity."
    """
    __tablename__ = 'deal_levers'

    id = db.Column(db.Integer, primary_key=True)
    deal_id = db.Column(db.Integer, db.ForeignKey('deals.id'), nullable=False, index=True)
    lever_id = db.Column(db.Integer, db.ForeignKey('synergy_levers.id'), nullable=False, index=True)

    # Benchmark inputs (from comparable deals)
    benchmark_pct_low = db.Column(db.Float, nullable=True)     # e.g. 1.2 (%)
    benchmark_pct_high = db.Column(db.Float, nullable=True)    # e.g. 2.1 (%)
    benchmark_pct_median = db.Column(db.Float, nullable=True)  # e.g. 1.7 (%)
    benchmark_n = db.Column(db.Integer, nullable=True)         # How many comparable deals

    # Baseline input (from client financial data)
    combined_baseline_usd = db.Column(db.BigInteger, nullable=True)  # Combined cost for this function

    # IQR range (P25–P75) — primary display range, more defensible than full min/max
    benchmark_pct_p25 = db.Column(db.Float, nullable=True)
    benchmark_pct_p75 = db.Column(db.Float, nullable=True)

    # Calculated output (derived from P25/P75, not absolute min/max)
    calculated_value_low = db.Column(db.BigInteger, nullable=True)
    calculated_value_high = db.Column(db.BigInteger, nullable=True)

    # Realization layer: theoretical × capture rate = what team expects to actually realize
    realization_factor = db.Column(db.Float, nullable=True, default=0.75)
    realizable_value_low = db.Column(db.BigInteger, nullable=True)
    realizable_value_high = db.Column(db.BigInteger, nullable=True)

    # Advisor judgment
    status = db.Column(db.String(30), nullable=False, default='identified')
    # 'identified' | 'in_analysis' | 'validated' | 'excluded'
    confidence = db.Column(db.String(20), nullable=True)   # 'high' | 'medium' | 'low'
    advisor_notes = db.Column(db.Text, nullable=True)
    environment_data = db.Column(db.JSON, nullable=True)   # {question: answer} diligence checklist

    # AI-refined estimate (from diligence Q&A → Claude)
    refined_pct_low = db.Column(db.Float, nullable=True)
    refined_pct_high = db.Column(db.Float, nullable=True)
    refinement_rationale = db.Column(db.Text, nullable=True)

    # Team review
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    deal = db.relationship('Deal', back_populates='deal_levers')
    lever = db.relationship('SynergyLever', back_populates='deal_levers')
    assigned_to = db.relationship('User', foreign_keys=[assigned_to_id])
    activities = db.relationship(
        'Synergy',
        back_populates='deal_lever',
        lazy='dynamic'
    )
    comments = db.relationship(
        'LeverComment',
        back_populates='deal_lever',
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by='LeverComment.created_at'
    )

    __table_args__ = (
        db.UniqueConstraint('deal_id', 'lever_id', name='uq_deal_lever'),
    )

    def __repr__(self):
        return f'<DealLever deal={self.deal_id} lever={self.lever_id}>'

    def to_dict(self, include_activities=False):
        data = {
            'id': self.id,
            'deal_id': self.deal_id,
            'lever_id': self.lever_id,
            'lever_name': self.lever.name if self.lever else None,
            'lever_type': self.lever.lever_type if self.lever else None,
            'benchmark_pct_low': self.benchmark_pct_low,
            'benchmark_pct_high': self.benchmark_pct_high,
            'benchmark_pct_median': self.benchmark_pct_median,
            'benchmark_n': self.benchmark_n,
            'combined_baseline_usd': self.combined_baseline_usd,
            'benchmark_pct_p25': self.benchmark_pct_p25,
            'benchmark_pct_p75': self.benchmark_pct_p75,
            'calculated_value_low': self.calculated_value_low,
            'calculated_value_high': self.calculated_value_high,
            'realization_factor': self.realization_factor if self.realization_factor is not None else 0.75,
            'realizable_value_low': self.realizable_value_low,
            'realizable_value_high': self.realizable_value_high,
            'status': self.status,
            'confidence': self.confidence,
            'advisor_notes': self.advisor_notes,
            'environment_data': self.environment_data or {},
            'assigned_to_id': self.assigned_to_id,
            'assigned_to_name': (
                f"{self.assigned_to.first_name} {self.assigned_to.last_name}"
                if self.assigned_to else None
            ),
            'refined_pct_low': self.refined_pct_low,
            'refined_pct_high': self.refined_pct_high,
            'refinement_rationale': self.refinement_rationale,
        }
        if include_activities:
            data['activities'] = [a.to_dict() for a in self.activities]
        return data


class LeverComment(db.Model):
    """A comment left by an analyst on a specific DealLever."""
    __tablename__ = 'lever_comments'

    id = db.Column(db.Integer, primary_key=True)
    deal_lever_id = db.Column(db.Integer, db.ForeignKey('deal_levers.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_key_finding = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    deal_lever = db.relationship('DealLever', back_populates='comments')
    author = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'deal_lever_id': self.deal_lever_id,
            'user_id': self.user_id,
            'author_name': (
                f"{self.author.first_name} {self.author.last_name}"
                if self.author else 'Unknown'
            ),
            'body': self.body,
            'is_key_finding': self.is_key_finding or False,
            'created_at': self.created_at.isoformat() + 'Z',
        }
