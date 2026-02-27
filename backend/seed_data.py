"""
Seed script for demo data.

Architecture:
  SynergyLever → functional buckets (IT, Finance, HR, Ops, Procurement, Real Estate)
  BenchmarkProject → comparable deals (APQC-style rows)
  BenchmarkDataPoint → project × lever × % of combined revenue
  DealCostBaseline → client's actual spend by function
  DealLever → benchmark % × baseline = $ synergy opportunity (the platform output)
  Synergy → specific activities under each lever (advisory layer)

Demo credentials:
    Email:    demo@synergies.ai
    Password: Demo1234!
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.extensions import db

from backend.app.models.organization import Organization
from backend.app.models.user import User
from backend.app.models.company import Company
from backend.app.models.deal import Deal
from backend.app.models.synergy import Synergy, SynergyMetric
from backend.app.models.industry import Industry
from backend.app.models.function import Function
from backend.app.models.category import Category
from backend.app.models.comment import Comment
from backend.app.models.mention import Mention
from backend.app.models.activity import Activity
from backend.app.models.assessment import Assessment, AssessmentQuestion, AssessmentResponse
from backend.app.models.learning_path import LearningPath, LearningPathItem
from backend.app.models.audit_log import AuditLog
from backend.app.models.workflow import WorkflowTransition
from backend.app.models.resource import Resource
from backend.app.models.lever import SynergyLever, BenchmarkProject, BenchmarkDataPoint, DealCostBaseline, DealLever
from backend.app.models.playbook import LeverPlaybook

DEMO_EMAIL = "demo@synergies.ai"
DEMO_PASSWORD = "Demo1234!"


def seed_organization():
    org = Organization.query.filter_by(name="Synergies Demo Corp").first()
    if org:
        print("  ⊘ Organization already exists")
        return org
    org = Organization(name="Synergies Demo Corp", domain="synergies.ai", subscription_tier="pro")
    db.session.add(org)
    db.session.flush()
    print("  ✓ Organization created")
    return org


def seed_user(org):
    user = User.query.filter_by(email=DEMO_EMAIL).first()
    if user:
        print(f"  ⊘ User {DEMO_EMAIL} already exists")
        return user
    user = User(
        email=DEMO_EMAIL, first_name="Demo", last_name="User",
        role="admin", organization_id=org.id,
    )
    user.set_password(DEMO_PASSWORD)
    db.session.add(user)
    db.session.flush()
    print(f"  ✓ User created: {DEMO_EMAIL}")
    return user


def seed_industries():
    data = [
        {"name": "Technology", "code": "TECH", "description": "Software, hardware, and digital services"},
        {"name": "Healthcare", "code": "HLTH", "description": "Pharmaceuticals, medical devices, and health services"},
        {"name": "Financial Services", "code": "FINS", "description": "Banking, insurance, and investment management"},
        {"name": "Manufacturing", "code": "MFGR", "description": "Industrial and consumer goods manufacturing"},
    ]
    industries = {}
    for item in data:
        existing = Industry.query.filter_by(code=item["code"]).first()
        if existing:
            industries[item["code"]] = existing
            continue
        ind = Industry(**item)
        db.session.add(ind)
        db.session.flush()
        industries[item["code"]] = ind
    print(f"  ✓ Industries ready ({len(industries)})")
    return industries


def seed_functions():
    data = [
        {"name": "Information Technology", "category": "IT", "description": "IT infrastructure, systems, and applications"},
        {"name": "Human Resources", "category": "HUMAN_RESOURCES", "description": "Workforce management and HR operations"},
        {"name": "Finance & Accounting", "category": "FINANCE", "description": "Financial planning, reporting, and control"},
        {"name": "Sales & Marketing", "category": "SALES_MARKETING", "description": "Revenue generation and customer acquisition"},
        {"name": "Operations", "category": "OPERATIONS", "description": "Core operational processes and supply chain"},
    ]
    functions = {}
    for item in data:
        existing = Function.query.filter_by(name=item["name"]).first()
        if existing:
            functions[item["category"]] = existing
            continue
        fn = Function(**item)
        db.session.add(fn)
        db.session.flush()
        functions[item["category"]] = fn
    print(f"  ✓ Functions ready ({len(functions)})")
    return functions


def seed_categories():
    data = [
        {"name": "Cost Synergies", "type": "COST", "description": "Savings from eliminating redundancy and scale benefits"},
        {"name": "Revenue Synergies", "type": "REVENUE", "description": "Incremental revenue from cross-sell and market expansion"},
        {"name": "Operational Synergies", "type": "OPERATIONAL", "description": "Process improvements and efficiency gains"},
        {"name": "Strategic Synergies", "type": "STRATEGIC", "description": "Competitive positioning and capability enhancements"},
    ]
    categories = {}
    for item in data:
        existing = Category.query.filter_by(name=item["name"]).first()
        if existing:
            categories[item["type"]] = existing
            continue
        cat = Category(**item)
        db.session.add(cat)
        db.session.flush()
        categories[item["type"]] = cat
    print(f"  ✓ Categories ready ({len(categories)})")
    return categories


def seed_levers():
    """
    The functional bucket columns — these are the lever categories in the APQC benchmarking data.
    synergy_pct values are expressed as % of combined revenue.
    """
    data = [
        {"name": "IT",           "lever_type": "cost",    "sort_order": 1,
         "description": "Technology infrastructure, applications, and IT operations"},
        {"name": "Finance",      "lever_type": "cost",    "sort_order": 2,
         "description": "Finance, accounting, FP&A, and treasury functions"},
        {"name": "HR",           "lever_type": "cost",    "sort_order": 3,
         "description": "Human resources, payroll, benefits, and talent functions"},
        {"name": "Operations",   "lever_type": "cost",    "sort_order": 4,
         "description": "Core operations, supply chain, and facilities"},
        {"name": "Procurement",  "lever_type": "cost",    "sort_order": 5,
         "description": "Vendor management, sourcing, and purchasing"},
        {"name": "Real Estate",  "lever_type": "cost",    "sort_order": 6,
         "description": "Office footprint, leases, and facilities consolidation"},
        {"name": "Revenue",      "lever_type": "revenue", "sort_order": 7,
         "description": "Cross-sell, upsell, market access, and pricing synergies"},
    ]
    levers = {}
    for item in data:
        existing = SynergyLever.query.filter_by(name=item["name"]).first()
        if existing:
            levers[item["name"]] = existing
            continue
        lever = SynergyLever(**item)
        db.session.add(lever)
        db.session.flush()
        levers[item["name"]] = lever
    print(f"  ✓ Levers ready ({len(levers)})")
    return levers


def seed_benchmark_projects(levers):
    """
    Comparable deals — each row is one project/deal from the benchmarking dataset.
    synergy_pct values below are % of combined revenue realized as synergy in each lever.

    These are illustrative but calibrated to real APQC ranges for mid-market tech acquisitions.
    In production these rows come from the APQC Excel upload via API.
    """
    projects_data = [
        {
            "name": "Project Apex", "industry": "Technology", "deal_type": "acquisition",
            "deal_size_usd": 280_000_000, "combined_revenue_usd": 490_000_000,
            "close_year": 2022, "total_synergy_pct": 5.1, "source": "APQC",
            "datapoints": {
                "IT": 1.6, "Finance": 0.7, "HR": 1.1, "Operations": 0.9,
                "Procurement": 0.5, "Real Estate": 0.3,
            },
        },
        {
            "name": "Project Beacon", "industry": "Technology", "deal_type": "acquisition",
            "deal_size_usd": 410_000_000, "combined_revenue_usd": 680_000_000,
            "close_year": 2022, "total_synergy_pct": 5.8, "source": "APQC",
            "datapoints": {
                "IT": 1.9, "Finance": 0.8, "HR": 1.4, "Operations": 1.2,
                "Procurement": 0.3, "Real Estate": 0.2,
            },
        },
        {
            "name": "Project Cascade", "industry": "Technology", "deal_type": "acquisition",
            "deal_size_usd": 320_000_000, "combined_revenue_usd": 520_000_000,
            "close_year": 2023, "total_synergy_pct": 4.9, "source": "APQC",
            "datapoints": {
                "IT": 1.5, "Finance": 0.6, "HR": 1.0, "Operations": 1.1,
                "Procurement": 0.4, "Real Estate": 0.3,
            },
        },
        {
            "name": "Project Delta", "industry": "Technology", "deal_type": "acquisition",
            "deal_size_usd": 390_000_000, "combined_revenue_usd": 610_000_000,
            "close_year": 2023, "total_synergy_pct": 6.2, "source": "APQC",
            "datapoints": {
                "IT": 2.1, "Finance": 0.9, "HR": 1.5, "Operations": 1.3,
                "Procurement": 0.2, "Real Estate": 0.2,
            },
        },
        {
            "name": "Project Echo", "industry": "Technology", "deal_type": "acquisition",
            "deal_size_usd": 255_000_000, "combined_revenue_usd": 450_000_000,
            "close_year": 2024, "total_synergy_pct": 5.4, "source": "APQC",
            "datapoints": {
                "IT": 1.7, "Finance": 0.7, "HR": 1.2, "Operations": 1.0,
                "Procurement": 0.5, "Real Estate": 0.3,
            },
        },
        {
            "name": "Project Flare", "industry": "Technology", "deal_type": "acquisition",
            "deal_size_usd": 460_000_000, "combined_revenue_usd": 720_000_000,
            "close_year": 2024, "total_synergy_pct": 5.9, "source": "APQC",
            "datapoints": {
                "IT": 1.8, "Finance": 0.8, "HR": 1.3, "Operations": 1.2,
                "Procurement": 0.6, "Real Estate": 0.2,
            },
        },
        {
            "name": "Project Granite", "industry": "Technology", "deal_type": "acquisition",
            "deal_size_usd": 300_000_000, "combined_revenue_usd": 530_000_000,
            "close_year": 2024, "total_synergy_pct": 5.0, "source": "APQC",
            "datapoints": {
                "IT": 1.6, "Finance": 0.6, "HR": 1.1, "Operations": 0.9,
                "Procurement": 0.5, "Real Estate": 0.3,
            },
        },
    ]

    created = 0
    for p in projects_data:
        existing = BenchmarkProject.query.filter_by(name=p["name"]).first()
        if existing:
            continue
        dp_data = p.pop("datapoints")
        project = BenchmarkProject(**p)
        db.session.add(project)
        db.session.flush()

        for lever_name, pct in dp_data.items():
            lever = levers.get(lever_name)
            if not lever:
                continue
            dp = BenchmarkDataPoint(
                project_id=project.id,
                lever_id=lever.id,
                synergy_pct=pct,
            )
            db.session.add(dp)
        created += 1

    db.session.flush()
    print(f"  ✓ Benchmark projects ready ({created} new, {len(projects_data) - created} existing)")


def seed_companies():
    acquirer_data = {
        "name": "NovaTech Solutions",
        "industry": "Technology",
        "description": (
            "Enterprise software company specializing in CRM and ERP platforms. "
            "Strong enterprise sales motion with 2,400 customers across North America and Europe."
        ),
        "revenue_usd": 480_000_000,
        "employees": 2_800,
        "geography": ["North America", "Europe"],
        "products": ["NovaCRM Enterprise", "NovaERP Suite", "NovaAnalytics"],
        "tech_stack": ["AWS", "Kubernetes", "React", "PostgreSQL", "Python"],
        "strengths": ["Enterprise sales", "Customer retention (94%)", "Brand recognition"],
        "weaknesses": ["Weak SMB offering", "Limited AI capabilities", "No mobile-first product"],
    }
    target_data = {
        "name": "DataViz Inc.",
        "industry": "Technology",
        "description": (
            "AI-powered business intelligence and data visualization platform. "
            "Fast-growing SaaS with strong product but limited enterprise go-to-market."
        ),
        "revenue_usd": 85_000_000,
        "employees": 420,
        "geography": ["North America"],
        "products": ["DataViz Pro", "DataViz Embedded SDK", "DataViz Mobile"],
        "tech_stack": ["GCP", "React", "TypeScript", "BigQuery", "Python", "TensorFlow"],
        "strengths": ["AI/ML capabilities", "Product-led growth", "Modern tech stack"],
        "weaknesses": ["No enterprise sales team", "Limited customer success", "Single geography"],
    }
    acquirer = Company.query.filter_by(name=acquirer_data["name"]).first()
    if not acquirer:
        acquirer = Company(**acquirer_data)
        db.session.add(acquirer)
        db.session.flush()
        print(f"  ✓ Acquirer: {acquirer.name}")
    else:
        print(f"  ⊘ Acquirer exists: {acquirer.name}")

    target = Company.query.filter_by(name=target_data["name"]).first()
    if not target:
        target = Company(**target_data)
        db.session.add(target)
        db.session.flush()
        print(f"  ✓ Target: {target.name}")
    else:
        print(f"  ⊘ Target exists: {target.name}")

    return acquirer, target


def seed_deal(acquirer, target):
    from datetime import date
    deal = Deal.query.filter_by(name="NovaTech acquires DataViz Inc.").first()
    if deal:
        print(f"  ⊘ Deal exists: {deal.name}")
        return deal
    deal = Deal(
        name="NovaTech acquires DataViz Inc.",
        deal_type="acquisition",
        deal_size_usd=340_000_000,
        close_date=date(2026, 6, 30),
        strategic_rationale=(
            "NovaTech acquires DataViz to embed AI-powered analytics directly into its CRM and ERP suite, "
            "closing a critical product gap. The combination accelerates NovaTech's platform roadmap by "
            "18–24 months and gives DataViz immediate access to NovaTech's 2,400-customer enterprise base. "
            "Deal multiple: 4x ARR."
        ),
        acquirer_id=acquirer.id,
        target_id=target.id,
        status="active",
    )
    db.session.add(deal)
    db.session.flush()
    print(f"  ✓ Deal: {deal.name} (${deal.deal_size_usd:,})")
    return deal


def seed_cost_baselines(deal, acquirer, target, levers):
    """
    Client-provided cost data by function.
    Combined revenue: NovaTech $480M + DataViz $85M = $565M.
    These costs are illustrative but proportional.
    """
    baselines = [
        # (lever_name, company_role, company, annual_cost)
        ("IT",          "acquirer", acquirer, 43_000_000),   # ~9% of $480M revenue
        ("IT",          "target",   target,   14_000_000),   # ~16% of $85M (SaaS-heavy)
        ("Finance",     "acquirer", acquirer, 19_000_000),
        ("Finance",     "target",   target,    4_500_000),
        ("HR",          "acquirer", acquirer, 31_000_000),
        ("HR",          "target",   target,    6_800_000),
        ("Operations",  "acquirer", acquirer, 26_000_000),
        ("Operations",  "target",   target,    5_200_000),
        ("Procurement", "acquirer", acquirer, 14_000_000),
        ("Procurement", "target",   target,    2_800_000),
        ("Real Estate", "acquirer", acquirer, 11_000_000),
        ("Real Estate", "target",   target,    2_400_000),
    ]

    created = 0
    for lever_name, role, company, cost in baselines:
        lever = levers.get(lever_name)
        if not lever:
            continue
        existing = DealCostBaseline.query.filter_by(
            deal_id=deal.id, lever_id=lever.id, company_role=role
        ).first()
        if existing:
            continue
        baseline = DealCostBaseline(
            deal_id=deal.id,
            lever_id=lever.id,
            company_id=company.id,
            company_role=role,
            annual_cost_usd=cost,
        )
        db.session.add(baseline)
        created += 1

    db.session.flush()
    print(f"  ✓ Cost baselines: {created} rows")


def seed_deal_levers(deal, levers):
    """
    The benchmark-derived synergy opportunity per lever for this deal.
    Combined revenue = $565M.
    benchmark_pct = % of combined revenue (from 7 comparable deals above).
    calculated_value = combined_baseline × (benchmark_pct / 100) × combined_revenue

    We use combined_baseline_usd = acquirer + target costs for that function.
    The $ value is calculated as: combined_revenue × benchmark_pct / 100
    (consistent with how APQC benchmarks are expressed).
    """
    combined_revenue = 565_000_000

    lever_configs = [
        {
            "lever": "IT",
            "benchmark_pct_low": 1.5, "benchmark_pct_high": 2.1, "benchmark_pct_median": 1.7,
            "combined_baseline_usd": 57_000_000,   # $43M + $14M
            "status": "validated",
            "confidence": "high",
            "advisor_notes": (
                "7 comparable tech acquisitions benchmark IT at 1.5–2.1% of combined revenue. "
                "Primary levers: cloud infrastructure consolidation (AWS/GCP → single provider), "
                "application rationalization, and DevOps tooling overlap. "
                "High confidence — both companies have detailed IT spend data available."
            ),
        },
        {
            "lever": "Finance",
            "benchmark_pct_low": 0.6, "benchmark_pct_high": 0.9, "benchmark_pct_median": 0.7,
            "combined_baseline_usd": 23_500_000,   # $19M + $4.5M
            "status": "validated",
            "confidence": "high",
            "advisor_notes": (
                "Finance consolidation benchmarks at 0.6–0.9%. "
                "DataViz currently uses outsourced CFO services and NetSuite — "
                "migration to NovaTech SAP is straightforward. "
                "Savings come from eliminating outsourced finance and consolidating FP&A."
            ),
        },
        {
            "lever": "HR",
            "benchmark_pct_low": 1.0, "benchmark_pct_high": 1.5, "benchmark_pct_median": 1.2,
            "combined_baseline_usd": 37_800_000,   # $31M + $6.8M
            "status": "in_analysis",
            "confidence": "medium",
            "advisor_notes": (
                "HR benchmarks at 1.0–1.5%. Main opportunity is payroll/benefits consolidation "
                "onto NovaTech's Workday instance and elimination of DataViz's PEO contract. "
                "Medium confidence pending review of DataViz employment contracts and retention targets."
            ),
        },
        {
            "lever": "Operations",
            "benchmark_pct_low": 0.9, "benchmark_pct_high": 1.3, "benchmark_pct_median": 1.1,
            "combined_baseline_usd": 31_200_000,   # $26M + $5.2M
            "status": "identified",
            "confidence": "medium",
            "advisor_notes": (
                "Operations synergies at 0.9–1.3%, primarily from customer success consolidation "
                "and shared professional services. "
                "DataViz CS team of 12 can be absorbed into NovaTech's 180-person CS org."
            ),
        },
        {
            "lever": "Procurement",
            "benchmark_pct_low": 0.3, "benchmark_pct_high": 0.6, "benchmark_pct_median": 0.45,
            "combined_baseline_usd": 16_800_000,   # $14M + $2.8M
            "status": "identified",
            "confidence": "low",
            "advisor_notes": (
                "Procurement synergies are modest (0.3–0.6%) — both companies are software-heavy "
                "with limited physical procurement. "
                "Primary opportunity: SaaS vendor consolidation (Salesforce, Slack, etc.) using NovaTech's volume pricing."
            ),
        },
        {
            "lever": "Real Estate",
            "benchmark_pct_low": 0.2, "benchmark_pct_high": 0.4, "benchmark_pct_median": 0.27,
            "combined_baseline_usd": 13_400_000,   # $11M + $2.4M
            "status": "validated",
            "confidence": "high",
            "advisor_notes": (
                "DataViz Austin HQ (12,000 sq ft) consolidates into NovaTech Austin (8,000 sq ft) "
                "on lease renewal in Q3 2026. "
                "High confidence — lease terms confirmed, relocation cost estimated at $180K."
            ),
        },
    ]

    created = 0
    for config in lever_configs:
        lever = levers.get(config["lever"])
        if not lever:
            continue
        existing = DealLever.query.filter_by(deal_id=deal.id, lever_id=lever.id).first()
        if existing:
            continue
        pct_low = config["benchmark_pct_low"]
        pct_high = config["benchmark_pct_high"]
        dl = DealLever(
            deal_id=deal.id,
            lever_id=lever.id,
            benchmark_pct_low=pct_low,
            benchmark_pct_high=pct_high,
            benchmark_pct_median=config["benchmark_pct_median"],
            benchmark_n=7,
            combined_baseline_usd=config["combined_baseline_usd"],
            calculated_value_low=int(combined_revenue * pct_low / 100),
            calculated_value_high=int(combined_revenue * pct_high / 100),
            status=config["status"],
            confidence=config["confidence"],
            advisor_notes=config["advisor_notes"],
        )
        db.session.add(dl)
        db.session.flush()
        created += 1

    db.session.flush()
    print(f"  ✓ Deal levers: {created} created")
    return {l.lever.name: l for l in DealLever.query.filter_by(deal_id=deal.id).all()}


def seed_synergy_activities(deal, acquirer, target, deal_lever_map, functions, categories):
    """
    Specific activities under each lever — the advisory/execution layer.
    Each activity belongs to a DealLever and provides the 'what to do' detail.
    """
    activities_data = [
        # IT lever activities
        {
            "lever": "IT", "synergy_type": "cost_reduction",
            "description": (
                "Consolidate cloud infrastructure: standardize on AWS, wind down GCP usage. "
                "Eliminate ~40% of duplicated DevOps tooling and achieve volume discount on AWS."
            ),
            "value_low": 5_500_000, "value_high": 7_500_000,
            "confidence_score": 87.0, "status": "validated",
            "function_key": "IT", "category_key": "COST",
        },
        {
            "lever": "IT", "synergy_type": "cost_reduction",
            "description": (
                "Rationalize application portfolio: audit 180+ SaaS licenses across both companies, "
                "eliminate duplicates (two CRM tools, three BI tools, two project management systems)."
            ),
            "value_low": 3_000_000, "value_high": 4_500_000,
            "confidence_score": 82.0, "status": "in_progress",
            "function_key": "IT", "category_key": "COST",
        },
        # Finance lever activities
        {
            "lever": "Finance", "synergy_type": "cost_reduction",
            "description": (
                "Migrate DataViz from outsourced CFO services and NetSuite "
                "onto NovaTech's SAP instance. Absorb FP&A into existing NovaTech finance team of 18."
            ),
            "value_low": 2_200_000, "value_high": 3_100_000,
            "confidence_score": 90.0, "status": "validated",
            "function_key": "FINANCE", "category_key": "COST",
        },
        # HR lever activities
        {
            "lever": "HR", "synergy_type": "cost_reduction",
            "description": (
                "Consolidate HR onto NovaTech Workday instance: payroll, benefits, and talent management. "
                "Eliminate DataViz's BambooHR subscription and PEO contract covering 420 employees."
            ),
            "value_low": 3_200_000, "value_high": 4_800_000,
            "confidence_score": 84.0, "status": "in_analysis",
            "function_key": "HUMAN_RESOURCES", "category_key": "COST",
        },
        # Operations lever activities
        {
            "lever": "Operations", "synergy_type": "process_optimization",
            "description": (
                "Transfer DataViz's 220 accounts to NovaTech customer success team. "
                "Reduce DataViz CS headcount of 12 by 8 through attrition over 12 months."
            ),
            "value_low": 3_800_000, "value_high": 5_500_000,
            "confidence_score": 79.0, "status": "identified",
            "function_key": "OPERATIONS", "category_key": "OPERATIONAL",
        },
        # Real Estate lever activities
        {
            "lever": "Real Estate", "synergy_type": "cost_reduction",
            "description": (
                "Consolidate DataViz Austin HQ (12,000 sq ft) into NovaTech Austin office at lease renewal (Q3 2026). "
                "Net savings after $180K relocation cost."
            ),
            "value_low": 1_000_000, "value_high": 1_600_000,
            "confidence_score": 93.0, "status": "validated",
            "function_key": "OPERATIONS", "category_key": "COST",
        },
        # Revenue lever activities
        {
            "lever": "Revenue", "synergy_type": "revenue_enhancement",
            "description": (
                "Cross-sell DataViz Pro to NovaTech's 2,400 enterprise customers. "
                "Assumed 15% attach rate in Year 1 at $18K ACV = $6.5M incremental ARR."
            ),
            "value_low": 5_500_000, "value_high": 9_800_000,
            "confidence_score": 68.0, "status": "identified",
            "function_key": "SALES_MARKETING", "category_key": "REVENUE",
        },
        {
            "lever": "Revenue", "synergy_type": "revenue_enhancement",
            "description": (
                "Embed DataViz SDK natively into NovaCRM and NovaERP as premium analytics module. "
                "Upsell at $8K/year to existing customers — addresses #1 feature request in 2025 survey."
            ),
            "value_low": 3_200_000, "value_high": 6_500_000,
            "confidence_score": 65.0, "status": "identified",
            "function_key": "SALES_MARKETING", "category_key": "REVENUE",
        },
    ]

    created = 0
    for a in activities_data:
        lever_name = a.pop("lever")
        fn_key = a.pop("function_key")
        cat_key = a.pop("category_key")
        dl = deal_lever_map.get(lever_name)

        existing = Synergy.query.filter_by(
            company1_id=acquirer.id,
            company2_id=target.id,
            description=a["description"],
        ).first()
        if existing:
            continue

        synergy = Synergy(
            company1_id=acquirer.id,
            company2_id=target.id,
            deal_id=deal.id,
            deal_lever_id=dl.id if dl else None,
            function_id=functions[fn_key].id if fn_key in functions else None,
            category_id=categories[cat_key].id if cat_key in categories else None,
            **a,
        )
        db.session.add(synergy)
        created += 1

    db.session.flush()
    print(f"  ✓ Synergy activities: {created} created")


def seed_playbooks(user):
    """
    Seed methodology playbook content for each cost lever.
    Written from the perspective of an M&A advisor — this is what analysts actually use.
    """
    playbook_data = {
        "IT": {
            "what_it_is": (
                "IT synergies arise from eliminating duplicated technology infrastructure, "
                "consolidating application portfolios, and achieving scale economics on vendor contracts. "
                "In a typical tech acquisition, IT is the single largest cost synergy lever — "
                "commonly 1.5–2.1% of combined revenue — because both companies carry full IT stacks "
                "that were built independently.\n\n"
                "The three primary sources are: (1) infrastructure consolidation (cloud, data center, network), "
                "(2) application rationalization (eliminating redundant SaaS, licenses, and custom systems), "
                "and (3) IT headcount optimization through shared services."
            ),
            "what_drives_it": (
                "The size of the IT synergy is driven by:\n\n"
                "• **Degree of overlap** — two companies running separate ERP, CRM, HRIS, and BI tools "
                "is the classic pattern. More overlap = more opportunity.\n"
                "• **Cloud concentration** — if acquirer is AWS-heavy and target is GCP-heavy, "
                "infrastructure consolidation saves 15–30% on cloud bills via volume discounts.\n"
                "• **SaaS sprawl** — targets <500 employees often have 80–150 SaaS tools with no governance. "
                "Post-merger audit typically eliminates 30–40% of seats.\n"
                "• **Legacy tech debt** — the more legacy the acquirer's stack, the lower the synergy "
                "(consolidation costs offset savings).\n"
                "• **IT headcount ratio** — if the target has a disproportionately large IT team relative "
                "to revenue, that's a direct savings signal."
            ),
            "diligence_questions": [
                "What is the total annual IT spend by category (infrastructure, applications, headcount, vendor support)?",
                "Which ERP, CRM, HRIS, and BI systems are in use at each company — and what are the contract end dates?",
                "What is the cloud spend split by provider (AWS / Azure / GCP)? What are current contractual commitments?",
                "How many SaaS tools are licensed? Is there a software asset management (SAM) inventory?",
                "What is the IT org chart? How many FTEs and contractors? What is the split between run-the-business and build?",
                "Are there any long-term vendor contracts or software licenses that cannot be terminated without penalty?",
                "What is the current state of identity management (SSO / IAM)? Single tenant or multi-tenant apps?",
                "Has either company recently completed a major system migration (e.g. ERP upgrade, cloud migration)?"
            ],
            "red_flags": [
                "Target is mid-ERP migration — consolidation costs will exceed savings for 18–24 months",
                "Multi-year cloud commitments (AWS EDP / Azure commit) that can't be renegotiated post-close",
                "Heavy custom-built internal tooling — integration costs are typically 2–3x the estimated savings",
                "IT team is deeply embedded in the product org — 'IT headcount' reduction risks product delivery",
                "No software asset management — indicates poor contract hygiene and hidden spend",
                "Significant technical debt in core systems — modernization must precede consolidation"
            ],
            "team_notes": (
                "From Project Apex: cloud consolidation (AWS→AWS) was straightforward — "
                "achieved 22% infrastructure savings within 6 months. Application rationalization "
                "took 14 months vs. the 9-month estimate because of undocumented integrations in the target's CRM.\n\n"
                "Rule of thumb: budget 1.5× the estimated savings as the integration cost for IT, "
                "and phase savings over 18–24 months, not 12."
            ),
        },
        "Finance": {
            "what_it_is": (
                "Finance synergies come from eliminating duplicate finance functions and consolidating "
                "onto a single set of systems, processes, and team. In a typical acquisition where the "
                "target is a growth-stage company (50–500 employees), finance is often lightly resourced "
                "— frequently relying on outsourced CFO services, simple accounting tools (NetSuite, QuickBooks), "
                "and contractors for FP&A.\n\n"
                "The benchmark range is 0.6–0.9% of combined revenue. This is a high-confidence lever "
                "because the costs are visible, the integration path is well-understood, and the savings "
                "are largely structural (headcount + systems, not behavioral change)."
            ),
            "what_drives_it": (
                "Key value drivers:\n\n"
                "• **Target's finance structure** — outsourced CFO + controller = high synergy. "
                "In-house team of 15+ = lower synergy but still achievable.\n"
                "• **Systems gap** — target on QuickBooks or NetSuite migrating to acquirer's SAP/Oracle "
                "is a known cost/effort. Budget $200–400K for migration; savings materialize in Year 2.\n"
                "• **Reporting consolidation** — eliminating duplicative management reporting, "
                "board packs, and investor reporting is 2–4 FTE equivalent.\n"
                "• **Audit and compliance** — combined entity needs one audit, one SOX compliance program, "
                "one set of external advisors. Tax consolidation alone can be $300–600K annually.\n"
                "• **Treasury efficiency** — combined cash management and banking relationships typically "
                "save $100–250K in fees."
            ),
            "diligence_questions": [
                "What is the target's finance org structure? Headcount by function (accounting, FP&A, tax, treasury)?",
                "Is the CFO/Controller outsourced or in-house? What are the contract terms?",
                "What accounting system does the target use? When is the contract up? What's the migration complexity?",
                "What is the target's annual spend on external audit, tax advisors, and legal counsel?",
                "Does the target have transfer pricing complexity or multi-entity structure that complicates consolidation?",
                "What is the target's revenue recognition policy and are there any non-standard accounting treatments?",
                "Are there any earn-outs, contingent consideration, or variable compensation structures post-close?",
                "What is the target's monthly close cycle time? Is it compatible with the acquirer's reporting calendar?"
            ],
            "red_flags": [
                "Target has non-standard revenue recognition (e.g. multi-element arrangements in SaaS) — restatement risk",
                "CFO or Controller is a retention risk and holds all institutional knowledge",
                "Complex multi-entity legal structure with intercompany transactions — consolidation takes 12–18 months",
                "Outstanding audit qualifications, material weaknesses, or restatement history",
                "Target's fiscal year doesn't align with acquirer's — creates 12+ months of reporting overlap",
                "Earn-out provisions tied to standalone metrics that conflict with integration goals"
            ],
            "team_notes": (
                "Finance is typically our highest-confidence lever in tech acquisitions — "
                "we've never missed by more than 15% when the target's finance structure is clear.\n\n"
                "Watch for: tax integration complexity is almost always underestimated. "
                "Get the tax team involved in diligence, not just post-signing.\n\n"
                "The outsourced CFO situation is a gift — but make sure the acquirer's CFO "
                "has bandwidth to absorb the target's reporting requirements in Year 1."
            ),
        },
        "HR": {
            "what_it_is": (
                "HR synergies come from consolidating human resources infrastructure: systems (HRIS, payroll, benefits), "
                "vendors (PEO contracts, benefits brokers, EAP providers), and administrative headcount. "
                "This is distinct from workforce restructuring — HR synergies are about the machinery of HR, "
                "not decisions about which roles to eliminate.\n\n"
                "Benchmark: 1.0–1.5% of combined revenue. Medium confidence because it depends on "
                "employment contract review and retention decisions that are often still in flux at the time "
                "of diligence."
            ),
            "what_drives_it": (
                "Key value drivers:\n\n"
                "• **PEO / EOR contracts** — smaller targets (under 200 employees) often use a PEO "
                "(TriNet, Justworks, Rippling) which carries a significant per-employee premium. "
                "Moving onto the acquirer's self-insured benefits plan saves $1,500–3,000 per employee annually.\n"
                "• **Benefits cost consolidation** — group buying power on health insurance, dental, vision. "
                "Larger combined headcount = better rates. Typically 8–15% reduction on benefits spend.\n"
                "• **HRIS migration** — target moves from BambooHR/Rippling to acquirer's Workday/ADP. "
                "One-time migration cost, then ongoing per-seat savings.\n"
                "• **HR admin headcount** — small targets often have a HRBP-heavy model relative to size. "
                "Shared services model reduces ratio to 1 HR FTE per 100–150 employees."
            ),
            "diligence_questions": [
                "What HRIS and payroll systems does the target use? What are the contract terms and exit costs?",
                "Is the target on a PEO or EOR? What is the annual per-employee cost premium vs. self-insured?",
                "What are the target's current benefits costs per employee vs. the acquirer's?",
                "How many HR FTEs does the target have? What are their roles (HRBP, recruiting, comp, admin)?",
                "Are there any change-of-control provisions in employment contracts that trigger on acquisition?",
                "What is the target's current attrition rate? Are there key retention risks in the HR-sensitive functions?",
                "What is the target's equity plan structure? How many option/RSU holders, and what are the vesting schedules?",
                "Are there any pending employment claims, EEOC complaints, or labor relation issues?"
            ],
            "red_flags": [
                "High-equity, low-cash compensation structure at target — retention cliff at 12–18 months post-close",
                "Change-of-control acceleration provisions in exec contracts that increase acquisition cost",
                "Target operates across multiple states with inconsistent HR policy — compliance harmonization is complex",
                "Active unionization effort or existing CBA — integration timeline and costs are unpredictable",
                "Key engineering / product talent has outside offers — integration disruption increases attrition risk",
                "Outstanding claims or lawsuits (wage, discrimination, harassment) — creates integration distraction"
            ],
            "team_notes": (
                "HR synergies are real but always slower than modeled. In our experience, "
                "PEO exit takes 3–6 months (enrollment windows, COBRA transitions), "
                "HRIS migration takes 6–9 months, and benefits harmonization is Year 2.\n\n"
                "The 1.0–1.5% benchmark applies to the HR cost structure, not headcount reductions. "
                "Workforce restructuring synergies are tracked separately (usually under Operations or the specific function).\n\n"
                "Retention: flag any engineer or PM with unvested equity > $500K. These are the people "
                "who will get recruited during diligence."
            ),
        },
        "Operations": {
            "what_it_is": (
                "Operations synergies cover customer success, professional services, support, "
                "and other post-sale functions that are delivered to customers. In SaaS companies, "
                "this lever is primarily about absorbing the target's CS and support teams into the "
                "acquirer's existing shared services.\n\n"
                "Benchmark: 0.9–1.3% of combined revenue. Medium confidence — depends on "
                "customer success model compatibility and retention strategy decisions."
            ),
            "what_drives_it": (
                "Key value drivers:\n\n"
                "• **CS team absorption** — if the acquirer has a scaled CS org (>100 FTEs), "
                "absorbing the target's 10–20 CSMs typically requires only 30–40% of the headcount "
                "due to automation and playbook leverage.\n"
                "• **Support consolidation** — combining ticketing systems (Zendesk, Intercom) and "
                "support tiers. Unified knowledge base reduces resolution time 20–30%.\n"
                "• **Professional services overlap** — if both companies sell implementation services, "
                "one delivery team is redundant for shared customers.\n"
                "• **Tooling rationalization** — customer success tools (Gainsight, ChurnZero, Totango). "
                "Two renewal platforms become one.\n"
                "• **Shared infrastructure** — combined NOC/SRE team, combined observability stack."
            ),
            "diligence_questions": [
                "What is the target's CS org structure and headcount by role (CSM, SA, support, PS)?",
                "What is the target's GRR and NRR? How do they compare to the acquirer's benchmarks?",
                "What CS tooling does the target use? What are contract terms?",
                "How many customer accounts does the target have, and what is the average account size?",
                "What is the average CSM-to-account ratio at the target vs. the acquirer?",
                "Are there any strategic accounts at the target that require white-glove treatment?",
                "What is the target's support SLA structure? Are there contractual commitments that raise cost?",
                "Does the target have a professional services P&L, and is it margin-positive?"
            ],
            "red_flags": [
                "Target's GRR is below 85% — integration will surface churn risk, not synergy",
                "Target has contractual SLA commitments with penalties that are incompatible with acquirer's model",
                "CS team is the primary customer relationship — headcount reduction will drive churn",
                "Target has a 'high-touch' enterprise CS model that can't be absorbed into a scaled motion",
                "Professional services is a loss-leader — PS revenue doesn't offset cost"
            ],
            "team_notes": (
                "The CS absorption synergy is often the most emotionally sensitive — "
                "customers notice when their CSM changes, and any disruption shows up in NRR 6–12 months later.\n\n"
                "Our practice: model the 'full synergy' (absorb all target CS headcount) "
                "but present to management with a 30% haircut for retention-driven overruns. "
                "Then make the retention vs. synergy tradeoff explicit.\n\n"
                "Tooling: if the target is on Gainsight and the acquirer is on ChurnZero, "
                "that's a $400K–800K migration cost. Add it to the integration cost column."
            ),
        },
        "Procurement": {
            "what_it_is": (
                "Procurement synergies come from combining vendor spend to unlock volume discounts, "
                "renegotiating contracts from a position of greater scale, and eliminating duplicated "
                "vendor relationships. For software-heavy businesses, this lever is primarily about "
                "SaaS and cloud vendor consolidation — physical procurement is minimal.\n\n"
                "Benchmark: 0.3–0.6% of combined revenue. Low-medium confidence — actual realization "
                "depends on contract timing and vendor negotiation outcomes."
            ),
            "what_drives_it": (
                "Key value drivers:\n\n"
                "• **SaaS vendor consolidation** — the single largest lever in tech acquisitions. "
                "Combined spend on Salesforce, Slack, Zoom, GitHub, Jira, Okta etc. qualifies for "
                "enterprise pricing tiers that neither company could access independently.\n"
                "• **Cloud volume discounts** — combined AWS/Azure/GCP spend often crosses discount tier boundaries. "
                "Every $1M of additional committed spend unlocks 2–5% additional discount.\n"
                "• **Duplicate vendor elimination** — two separate contracts for the same tool category "
                "(e.g. two monitoring solutions, two password managers) are cancelled on consolidation.\n"
                "• **Insurance and benefits procurement** — combined entity can renegotiate D&O, E&O, "
                "cyber liability premiums from a larger and more diversified risk pool."
            ),
            "diligence_questions": [
                "What is the target's top 20 vendor spend list, with contract values and renewal dates?",
                "Which SaaS tools does the target use that overlap with the acquirer's stack?",
                "What are the target's cloud spend commitments by provider and when do they renew?",
                "Does the target have any preferred vendor or exclusive supplier agreements?",
                "What insurance policies does the target carry, and what are the annual premiums?",
                "Who manages procurement at the target — is there a formal procurement function?",
                "Are there any vendor contracts with change-of-control clauses that require consent?"
            ],
            "red_flags": [
                "Multi-year SaaS contracts with significant termination penalties — savings are delayed 1–3 years",
                "Change-of-control clauses on key vendor agreements — renegotiation required, cost and time unpredictable",
                "Target has committed SaaS spend that vastly exceeds actual usage (over-licensed)",
                "No procurement function — informal spend management means contracts are poorly documented",
                "Key platform dependency on a vendor who is also a competitor (e.g. Salesforce as CRM when acquirer competes with Salesforce)"
            ],
            "team_notes": (
                "Procurement is the 'real but slow' lever. The savings are real but they materialize "
                "as contracts renew — which could be 6, 12, or 24 months post-close.\n\n"
                "In our model, we discount all procurement synergies by one year — "
                "i.e. if the contract renews in Q2 of Year 1, we model the saving from Year 2.\n\n"
                "The SaaS audit is almost always a positive surprise. We've never done a software audit "
                "where we didn't find at least one tool the target was paying for but had stopped using."
            ),
        },
        "Real Estate": {
            "what_it_is": (
                "Real estate synergies come from consolidating office footprints post-merger: "
                "exiting leases, co-locating teams, and renegotiating remaining leases from a "
                "position of reduced need. For knowledge-work businesses (SaaS, tech, professional services), "
                "real estate is often the quickest lever to execute — the path is simple "
                "(give notice, move teams, exit lease) and the savings are highly predictable.\n\n"
                "Benchmark: 0.2–0.4% of combined revenue. High confidence — lease terms are documentable "
                "and the savings math is arithmetic, not behavioral."
            ),
            "what_drives_it": (
                "Key value drivers:\n\n"
                "• **Geographic overlap** — if both companies have offices in the same city, "
                "one can be exited. The closer the offices, the lower the disruption to employees.\n"
                "• **Lease timing** — synergies are easy when the target's lease expires within 12 months. "
                "Breaking a lease mid-term requires a termination payment (typically 3–6 months rent).\n"
                "• **Acquirer's space utilization** — if the acquirer has excess capacity post-COVID "
                "(most do), absorbing the target's headcount costs nothing beyond furniture.\n"
                "• **Remote work policy** — higher remote-first culture = smaller target footprint "
                "= lower absolute synergy but also lower cost.\n"
                "• **Sublease market** — if the target's space is subleased rather than exited, "
                "the carrying cost continues until a subtenant is found."
            ),
            "diligence_questions": [
                "What are the target's office locations, lease terms, and annual rent by location?",
                "When do target office leases expire? Are there renewal options or break clauses?",
                "What is the square footage and occupancy rate at each target location?",
                "Does the acquirer have available capacity in cities where the target has offices?",
                "Are there any leasehold improvements that would be written off on lease exit?",
                "What is the sublease market like in the target's key locations?",
                "Are there any data center or co-location facilities that are office-equivalent fixed costs?"
            ],
            "red_flags": [
                "Long-term lease (5+ years remaining) with no break clause — exit cost could wipe out synergy value",
                "Leasehold improvement write-off is material (>$1M) — reduces net synergy",
                "Target's office is in a weak sublease market — carrying cost extends if can't sublease",
                "Key employee clusters are anchored to specific offices — consolidation triggers attrition",
                "Data center lease tied to production infrastructure — not a quick exit"
            ],
            "team_notes": (
                "Real estate is our most reliable lever — we've never had a real estate synergy "
                "miss by more than 10% when the lease terms are known.\n\n"
                "Quick checklist at LOI stage:\n"
                "  1. Pull the lease abstract for every target location\n"
                "  2. Check the acquirer's space capacity in those cities\n"
                "  3. Model 3 scenarios: exit at expiry, break clause, sublease\n\n"
                "Austin, NYC, and SF are hard sublease markets right now (2025). "
                "Seattle and Denver are better. Factor into your timeline assumptions."
            ),
        },
    }

    created = 0
    for lever_name, content in playbook_data.items():
        lever = SynergyLever.query.filter_by(name=lever_name).first()
        if not lever:
            continue
        existing = LeverPlaybook.query.filter_by(lever_id=lever.id).first()
        if existing:
            continue
        playbook = LeverPlaybook(
            lever_id=lever.id,
            last_edited_by_id=user.id,
            **content,
        )
        db.session.add(playbook)
        created += 1

    db.session.flush()
    print(f"  ✓ Lever playbooks: {created} created")


def main():
    app = create_app("development")
    with app.app_context():
        print("\n🌱 Seeding demo data...\n")

        print("→ Organization & User")
        org = seed_organization()
        user = seed_user(org)

        print("→ Lookup tables")
        industries = seed_industries()
        functions = seed_functions()
        categories = seed_categories()

        print("→ Synergy levers")
        levers = seed_levers()

        print("→ Benchmark data (APQC comparable deals)")
        seed_benchmark_projects(levers)

        print("→ Companies")
        acquirer, target = seed_companies()

        print("→ Deal")
        deal = seed_deal(acquirer, target)

        print("→ Cost baselines (client financial data)")
        seed_cost_baselines(deal, acquirer, target, levers)

        print("→ Deal levers (benchmark × baseline = $ opportunity)")
        deal_lever_map = seed_deal_levers(deal, levers)

        print("→ Synergy activities (advisory layer)")
        seed_synergy_activities(deal, acquirer, target, deal_lever_map, functions, categories)

        print("→ Lever playbooks (learning section content)")
        seed_playbooks(user)

        db.session.commit()

        # Summary
        combined_rev = 565_000_000
        total_low = sum(dl.calculated_value_low or 0 for dl in deal_lever_map.values())
        total_high = sum(dl.calculated_value_high or 0 for dl in deal_lever_map.values())

        print("\n" + "=" * 60)
        print("✅ Seed complete!")
        print("=" * 60)
        print(f"  Login:            {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"  Deal:             NovaTech acquires DataViz Inc. ($340M)")
        print(f"  Combined revenue: ${combined_rev:,.0f}")
        print(f"  Benchmark basis:  7 comparable tech acquisitions (APQC)")
        print()
        print(f"  COST SYNERGY OPPORTUNITY (by lever):")
        cost_levers = ["IT", "Finance", "HR", "Operations", "Procurement", "Real Estate"]
        for name in cost_levers:
            dl = deal_lever_map.get(name)
            if dl:
                pct = f"{dl.benchmark_pct_low}–{dl.benchmark_pct_high}%"
                val = f"${dl.calculated_value_low/1e6:.1f}M–${dl.calculated_value_high/1e6:.1f}M"
                print(f"    {name:<15} {pct:<12} {val}")
        print()
        print(f"  TOTAL COST SYNERGY RANGE: ${total_low/1e6:.1f}M – ${total_high/1e6:.1f}M")
        print(f"  AS % OF COMBINED REVENUE: {total_low/combined_rev*100:.1f}% – {total_high/combined_rev*100:.1f}%")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
