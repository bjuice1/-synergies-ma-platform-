#!/usr/bin/env python3
"""
Seed database with comprehensive test data.

Creates:
- Organizations
- Users (admin, analyst, viewer roles)
- Companies
- Industries
- Functions
- Categories
- Synergies with relationships
- Synergy Metrics
- Comments
- Activities
"""
import os
import sys
from datetime import datetime, timedelta

# Set up environment
os.environ['DATABASE_URL'] = 'sqlite:////Users/JB/Documents/Synergies/backend/dev.db'
os.environ['FLASK_ENV'] = 'development'

from backend.app import create_app
from backend.extensions import db
from backend.app.models.user import User
from backend.app.models.organization import Organization
from backend.app.models.company import Company
from backend.app.models.industry import Industry
from backend.app.models.function import Function
from backend.app.models.category import Category
from backend.app.models.synergy import Synergy, SynergyMetric
from backend.app.models.comment import Comment
from backend.app.models.activity import Activity

# Create Flask app context
app = create_app('development')


def clear_data():
    """Clear existing data (optional)."""
    print("🗑️  Clearing existing data...")

    # Delete in reverse order of dependencies
    Activity.query.delete()
    Comment.query.delete()
    SynergyMetric.query.delete()
    Synergy.query.delete()
    Company.query.delete()
    Category.query.delete()
    Function.query.delete()
    Industry.query.delete()
    User.query.delete()
    Organization.query.delete()
    db.session.commit()
    print("✅ Data cleared\n")


def seed_organizations():
    """Create organizations."""
    print("🏢 Creating organizations...")

    orgs_data = [
    {
        'name': 'TechCorp Holdings',
        'domain': 'techcorp.com',
        'subscription_tier': 'enterprise',
    },
    {
        'name': 'Global Industries Inc',
        'domain': 'globalind.com',
        'subscription_tier': 'professional',
    },
    ]

    orgs = []

    for org_data in orgs_data:
        org = Organization(
        name=org_data['name'],
        domain=org_data['domain'],
        subscription_tier=org_data['subscription_tier'],
        is_active=True
        )
        db.session.add(org)
        orgs.append(org)

    db.session.commit()
    print(f"   ✓ Created {len(orgs)} organizations")

    return orgs


def seed_users(organizations):
    """Create users with different roles."""
    print("👥 Creating users...")

    users_data = [
    {
        'email': 'admin@techcorp.com',
        'password': 'admin123',
        'first_name': 'Sarah',
        'last_name': 'Johnson',
        'role': 'admin',
        'organization': organizations[0],
    },
    {
        'email': 'analyst@techcorp.com',
        'password': 'analyst123',
        'first_name': 'Michael',
        'last_name': 'Chen',
        'role': 'analyst',
        'organization': organizations[0],
    },
    {
        'email': 'viewer@techcorp.com',
        'password': 'viewer123',
        'first_name': 'Emma',
        'last_name': 'Davis',
        'role': 'viewer',
        'organization': organizations[0],
    },
    {
        'email': 'analyst@globalind.com',
        'password': 'analyst123',
        'first_name': 'David',
        'last_name': 'Martinez',
        'role': 'analyst',
        'organization': organizations[1],
    },
    ]

    users = []

    for user_data in users_data:
        user = User(
        email=user_data['email'],
        first_name=user_data['first_name'],
        last_name=user_data['last_name'],
        role=user_data['role'],
        organization_id=user_data['organization'].id,
        is_active=True
        )
        user.set_password(user_data['password'])
        db.session.add(user)
        users.append(user)

    db.session.commit()
    print(f"   ✓ Created {len(users)} users")
    print("   📧 Login credentials:")
    for user_data in users_data:
        print(f"      {user_data['email']} / {user_data['password']} ({user_data['role']})")

    return users


def seed_industries():
    """Create industries."""
    print("🏭 Creating industries...")

    industries_data = [
    {'name': 'Technology', 'code': 'TECH', 'description': 'Software, hardware, and IT services'},
    {'name': 'Healthcare', 'code': 'HLTH', 'description': 'Medical devices, pharmaceuticals, and healthcare services'},
    {'name': 'Financial Services', 'code': 'FINC', 'description': 'Banking, insurance, and investment services'},
    {'name': 'Manufacturing', 'code': 'MANU', 'description': 'Industrial manufacturing and production'},
    {'name': 'Retail', 'code': 'RETL', 'description': 'Consumer retail and e-commerce'},
    ]

    industries = []

    for ind_data in industries_data:
        industry = Industry(
        name=ind_data['name'],
        code=ind_data['code'],
        description=ind_data['description'],
        is_active=True
        )
        db.session.add(industry)
        industries.append(industry)

    db.session.commit()
    print(f"   ✓ Created {len(industries)} industries")

    return industries


def seed_functions():
    """Create business functions."""
    print("⚙️  Creating functions...")

    functions_data = [
    {'name': 'Information Technology', 'category': 'IT', 'description': 'IT infrastructure, applications, and support'},
    {'name': 'Human Resources', 'category': 'HUMAN_RESOURCES', 'description': 'Recruitment, payroll, and benefits'},
    {'name': 'Finance & Accounting', 'category': 'FINANCE', 'description': 'Financial planning, accounting, and reporting'},
    {'name': 'Operations', 'category': 'OPERATIONS', 'description': 'Manufacturing, logistics, and supply chain'},
    {'name': 'Sales & Marketing', 'category': 'SALES_MARKETING', 'description': 'Sales operations and marketing'},
    {'name': 'Customer Service', 'category': 'CUSTOMER_SERVICE', 'description': 'Customer support and success'},
    ]

    functions = []

    for func_data in functions_data:
        function = Function(
        name=func_data['name'],
        category=func_data['category'],
        description=func_data['description'],
        is_active=True
        )
        db.session.add(function)
        functions.append(function)

    db.session.commit()
    print(f"   ✓ Created {len(functions)} functions")

    return functions


def seed_categories():
    """Create synergy categories."""
    print("📊 Creating categories...")

    categories_data = [
    {'name': 'Revenue Synergies', 'type': 'REVENUE', 'description': 'Cross-selling and market expansion opportunities'},
    {'name': 'Cost Synergies', 'type': 'COST', 'description': 'Cost reduction through consolidation and efficiency'},
    {'name': 'Operational Synergies', 'type': 'OPERATIONAL', 'description': 'Process improvements and operational efficiency'},
    {'name': 'Strategic Synergies', 'type': 'STRATEGIC', 'description': 'Strategic positioning and market advantages'},
    ]

    categories = []

    for cat_data in categories_data:
        category = Category(
        name=cat_data['name'],
        type=cat_data['type'],
        description=cat_data['description'],
        is_active=True
        )
        db.session.add(category)
        categories.append(category)

    db.session.commit()
    print(f"   ✓ Created {len(categories)} categories")

    return categories


def seed_companies():
    """Create companies."""
    print("🏢 Creating companies...")

    companies_data = [
    {'name': 'CloudTech Solutions', 'industry': 'Technology', 'description': 'Cloud infrastructure and SaaS provider'},
    {'name': 'DataFlow Analytics', 'industry': 'Technology', 'description': 'Big data analytics platform'},
    {'name': 'SecureNet Systems', 'industry': 'Technology', 'description': 'Cybersecurity solutions'},
    {'name': 'HealthMed Devices', 'industry': 'Healthcare', 'description': 'Medical device manufacturer'},
    {'name': 'PharmaCure Labs', 'industry': 'Healthcare', 'description': 'Pharmaceutical research and development'},
    {'name': 'GlobalBank Corp', 'industry': 'Financial Services', 'description': 'International banking services'},
    {'name': 'InsureMax Holdings', 'industry': 'Financial Services', 'description': 'Insurance and risk management'},
    {'name': 'ManufacturePro Inc', 'industry': 'Manufacturing', 'description': 'Industrial equipment manufacturer'},
    ]

    companies = []

    for comp_data in companies_data:
        company = Company(
        name=comp_data['name'],
        industry=comp_data['industry'],
        description=comp_data['description']
        )
        db.session.add(company)
        companies.append(company)

    db.session.commit()
    print(f"   ✓ Created {len(companies)} companies")

    return companies


def seed_synergies(companies, industries, functions, categories):
    """Create synergies between companies."""
    print("🔄 Creating synergies...")

    synergies_data = [
    {
        'companies': (0, 1),  # CloudTech + DataFlow
        'industry': 0,  # Technology
        'function': 0,  # IT
        'category': 1,  # Cost Synergies
        'synergy_type': 'cost_reduction',
        'description': 'Consolidate cloud infrastructure and eliminate duplicate data centers. Expected annual savings of $5.2M through infrastructure optimization.',
        'estimated_value': 5200000,
        'confidence_score': 85,
        'status': 'identified',
    },
    {
        'companies': (0, 2),  # CloudTech + SecureNet
        'industry': 0,  # Technology
        'function': 0,  # IT
        'category': 0,  # Revenue Synergies
        'synergy_type': 'revenue_enhancement',
        'description': 'Cross-sell security services to CloudTech customer base. Estimated 15% increase in security product revenue.',
        'estimated_value': 8500000,
        'confidence_score': 72,
        'status': 'identified',
    },
    {
        'companies': (3, 4),  # HealthMed + PharmaCure
        'industry': 1,  # Healthcare
        'function': 3,  # Operations
        'category': 2,  # Operational Synergies
        'synergy_type': 'operational_efficiency',
        'description': 'Integrate R&D processes and share clinical trial infrastructure. Reduce time-to-market by 6 months.',
        'estimated_value': 12000000,
        'confidence_score': 78,
        'status': 'validated',
    },
    {
        'companies': (5, 6),  # GlobalBank + InsureMax
        'industry': 2,  # Financial Services
        'function': 4,  # Sales & Marketing
        'category': 0,  # Revenue Synergies
        'synergy_type': 'revenue_enhancement',
        'description': 'Bundle banking and insurance products for cross-sell opportunities. Target 20% increase in product-per-customer ratio.',
        'estimated_value': 15300000,
        'confidence_score': 88,
        'status': 'validated',
    },
    {
        'companies': (0, 1),  # CloudTech + DataFlow
        'industry': 0,  # Technology
        'function': 1,  # HR
        'category': 1,  # Cost Synergies
        'synergy_type': 'cost_reduction',
        'description': 'Consolidate HR systems and reduce headcount redundancy. Expected savings of $2.8M annually.',
        'estimated_value': 2800000,
        'confidence_score': 90,
        'status': 'identified',
    },
    {
        'companies': (3, 4),  # HealthMed + PharmaCure
        'industry': 1,  # Healthcare
        'function': 2,  # Finance
        'category': 1,  # Cost Synergies
        'synergy_type': 'cost_reduction',
        'description': 'Merge finance operations and implement shared services. Estimated $3.5M annual savings.',
        'estimated_value': 3500000,
        'confidence_score': 85,
        'status': 'identified',
    },
    {
        'companies': (1, 2),  # DataFlow + SecureNet
        'industry': 0,  # Technology
        'function': 0,  # IT
        'category': 3,  # Strategic Synergies
        'synergy_type': 'strategic_positioning',
        'description': 'Create integrated secure analytics platform. Differentiate from competitors and capture new market segment.',
        'estimated_value': 18000000,
        'confidence_score': 65,
        'status': 'identified',
    },
    ]

    synergies = []

    for syn_data in synergies_data:
        synergy = Synergy(
        company1_id=companies[syn_data['companies'][0]].id,
        company2_id=companies[syn_data['companies'][1]].id,
        industry_id=industries[syn_data['industry']].id,
        function_id=functions[syn_data['function']].id,
        category_id=categories[syn_data['category']].id,
        synergy_type=syn_data['synergy_type'],
        description=syn_data['description'],
        estimated_value=syn_data['estimated_value'],
        confidence_score=syn_data['confidence_score'],
        status=syn_data['status']
        )
        db.session.add(synergy)
        synergies.append(synergy)

    db.session.commit()
    print(f"   ✓ Created {len(synergies)} synergies")

    return synergies


def seed_synergy_metrics(synergies):
    """Create metrics for synergies."""
    print("📈 Creating synergy metrics...")

    metrics_data = [
    # Metrics for first synergy (infrastructure consolidation)
    {'synergy': 0, 'metric_name': 'Annual Cost Savings', 'metric_value': 5200000, 'unit': 'USD', 'timeframe': 'Year 1'},
    {'synergy': 0, 'metric_name': 'Server Reduction', 'metric_value': 45, 'unit': 'percentage', 'timeframe': '18 months'},
    {'synergy': 0, 'metric_name': 'Energy Savings', 'metric_value': 1200000, 'unit': 'USD', 'timeframe': 'Annual'},

    # Metrics for second synergy (cross-sell)
    {'synergy': 1, 'metric_name': 'Revenue Increase', 'metric_value': 8500000, 'unit': 'USD', 'timeframe': 'Year 2'},
    {'synergy': 1, 'metric_name': 'Customer Adoption Rate', 'metric_value': 15, 'unit': 'percentage', 'timeframe': '12 months'},

    # Metrics for third synergy (R&D integration)
    {'synergy': 2, 'metric_name': 'Time-to-Market Reduction', 'metric_value': 6, 'unit': 'months', 'timeframe': 'Per product'},
    {'synergy': 2, 'metric_name': 'R&D Cost Savings', 'metric_value': 12000000, 'unit': 'USD', 'timeframe': 'Annual'},
    ]

    metrics = []

    for met_data in metrics_data:
        metric = SynergyMetric(
        synergy_id=synergies[met_data['synergy']].id,
        metric_name=met_data['metric_name'],
        metric_value=met_data['metric_value'],
        unit=met_data['unit'],
        timeframe=met_data['timeframe']
        )
        db.session.add(metric)
        metrics.append(metric)

    db.session.commit()
    print(f"   ✓ Created {len(metrics)} synergy metrics")

    return metrics


def seed_comments(synergies, users):
    """Create comments on synergies."""
    print("💬 Creating comments...")

    comments_data = [
    {
        'synergy': 0,
        'user': 1,  # Analyst
        'content': 'Infrastructure audit completed. Identified 12 redundant servers in EU region that can be decommissioned.',
    },
    {
        'synergy': 0,
        'user': 0,  # Admin
        'content': 'Great analysis! Let\'s prioritize the EU servers for Q1 migration. What\'s the estimated downtime?',
    },
    {
        'synergy': 1,
        'user': 1,  # Analyst
        'content': 'Security team recommends phased rollout starting with enterprise customers. SMB segment in Q2.',
    },
    {
        'synergy': 2,
        'user': 3,  # Analyst from other org
        'content': 'Clinical trial data integration needs FDA compliance review before proceeding.',
    },
    ]

    comments = []

    for comm_data in comments_data:
        comment = Comment(
        synergy_id=synergies[comm_data['synergy']].id,
        user_id=users[comm_data['user']].id,
        content=comm_data['content'],
        created_at=datetime.utcnow() - timedelta(days=len(comments))
        )
        db.session.add(comment)
        comments.append(comment)

    db.session.commit()
    print(f"   ✓ Created {len(comments)} comments")

    return comments


def seed_activities(users, synergies):
    """Create activity log entries."""
    print("📝 Creating activities...")

    activities_data = [
    {
        'user': 0,
        'action_type': 'created',
        'resource_type': 'synergy',
        'resource_id': synergies[0].id,
        'meta_data': {'description': 'Created synergy: Infrastructure consolidation'},
        'days_ago': 5,
    },
    {
        'user': 1,
        'action_type': 'updated',
        'resource_type': 'synergy',
        'resource_id': synergies[0].id,
        'meta_data': {'description': 'Updated estimated value based on infrastructure audit'},
        'days_ago': 3,
    },
    {
        'user': 0,
        'action_type': 'updated',
        'resource_type': 'synergy',
        'resource_id': synergies[2].id,
        'meta_data': {'description': 'Approved R&D integration synergy for implementation'},
        'days_ago': 2,
    },
    {
        'user': 1,
        'action_type': 'commented',
        'resource_type': 'synergy',
        'resource_id': synergies[0].id,
        'meta_data': {'description': 'Added comment on infrastructure synergy'},
        'days_ago': 1,
    },
    ]

    activities = []

    for act_data in activities_data:
        activity = Activity(
        user_id=users[act_data['user']].id,
        action_type=act_data['action_type'],
        resource_type=act_data['resource_type'],
        resource_id=act_data['resource_id'],
        meta_data=act_data.get('meta_data'),
        created_at=datetime.utcnow() - timedelta(days=act_data['days_ago'])
        )
        db.session.add(activity)
        activities.append(activity)

    db.session.commit()
    print(f"   ✓ Created {len(activities)} activity entries")

    return activities


def display_summary():
    """Display summary of seeded data."""
    print("\n" + "="*70)
    print("📊 SEED DATA SUMMARY")
    print("="*70)


    org_count = Organization.query.count()
    user_count = User.query.count()
    company_count = Company.query.count()
    industry_count = Industry.query.count()
    function_count = Function.query.count()
    category_count = Category.query.count()
    synergy_count = Synergy.query.count()
    metric_count = SynergyMetric.query.count()
    comment_count = Comment.query.count()
    activity_count = Activity.query.count()

    total_value = db.session.query(db.func.sum(Synergy.estimated_value)).scalar() or 0

    print(f"\n📈 Statistics:")
    print(f"   Organizations:    {org_count}")
    print(f"   Users:        {user_count}")
    print(f"   Companies:    {company_count}")
    print(f"   Industries:       {industry_count}")
    print(f"   Functions:    {function_count}")
    print(f"   Categories:       {category_count}")
    print(f"   Synergies:    {synergy_count}")
    print(f"   Synergy Metrics:  {metric_count}")
    print(f"   Comments:     {comment_count}")
    print(f"   Activities:       {activity_count}")

    print(f"\n💰 Total Synergy Value: ${total_value:,.0f}")

    print("\n🔑 Test Credentials:")
    print("   admin@techcorp.com / admin123 (Admin)")
    print("   analyst@techcorp.com / analyst123 (Analyst)")
    print("   viewer@techcorp.com / viewer123 (Viewer)")

    print("\n🌐 API Endpoints:")
    print("   http://127.0.0.1:5001/api/auth/login")
    print("   http://127.0.0.1:5001/api/synergies")
    print("   http://127.0.0.1:5001/api/industries")

    print("\n" + "="*70)


def main():
    """Main seeding function."""
    print("\n" + "="*70)
    print("🌱 SEEDING DATABASE")
    print("="*70 + "\n")

    # Optional: Clear existing data
    # clear_data()

    # Seed everything in one app context to avoid detached instances
    with app.app_context():
        # Seed in order (respecting foreign key dependencies)
        orgs = seed_organizations()
        users = seed_users(orgs)
        industries = seed_industries()
        functions = seed_functions()
        categories = seed_categories()
        companies = seed_companies()
        synergies = seed_synergies(companies, industries, functions, categories)
        metrics = seed_synergy_metrics(synergies)
        comments = seed_comments(synergies, users)
        activities = seed_activities(users, synergies)

    with app.app_context():
        display_summary()

    print("\n✅ Database seeding complete!\n")


if __name__ == '__main__':
    main()
