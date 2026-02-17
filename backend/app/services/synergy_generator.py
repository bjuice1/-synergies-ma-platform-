"""
Synergy generation service.

Phase 1: Simple rule-based synergy identification.
Future: LLM-powered analysis.
"""


def generate_synergies_for_deal(deal, acquirer, target):
    """
    Generate potential synergies for a deal based on simple patterns.

    Args:
        deal: Deal model instance
        acquirer: Company model instance (acquiring company)
        target: Company model instance (target company)

    Returns:
        list: List of synergy dictionaries ready to be created
    """
    # Input validation - ensure required objects exist
    if not all([deal, acquirer, target]):
        return []

    # Sanitize inputs - prevent negative values that would produce nonsense synergies
    if acquirer.revenue_usd and acquirer.revenue_usd < 0:
        acquirer.revenue_usd = None
    if target.revenue_usd and target.revenue_usd < 0:
        target.revenue_usd = None
    if acquirer.employees and acquirer.employees < 0:
        acquirer.employees = None
    if target.employees and target.employees < 0:
        target.employees = None

    synergies = []

    # Pattern 1: Cross-Sell Revenue Synergy
    if acquirer.employees and target.revenue_usd:
        # Assume acquirer can cross-sell target's products to existing customers
        # Conservative: 15-30% of acquirer's customer base (proxied by employee count)
        estimated_customers = acquirer.employees * 0.5  # Rough proxy: 1 customer per 2 employees
        target_arpu = target.revenue_usd / (target.employees * 10) if target.employees else 50000  # Estimate ARPU

        value_low = estimated_customers * 0.15 * target_arpu
        value_high = estimated_customers * 0.30 * target_arpu

        synergies.append({
            'synergy_type': f'Revenue - Cross-Sell {target.name} Products',
            'description': f'Cross-sell {target.name}\'s products to {acquirer.name}\'s customer base. Conservative 15-30% penetration over 18-24 months.',
            'value_low': int(value_low),
            'value_high': int(value_high),
            'confidence_level': 'medium',
            'realization_timeline': '18-24 months',
            'status': 'IDENTIFIED',
            'company1_id': acquirer.id,
            'company2_id': target.id,
            'deal_id': deal.id,
        })

    # Pattern 2: Cost Synergy - Headcount Consolidation
    if target.employees:
        # Assume 10-15% of target's workforce is in redundant corporate functions
        redundant_headcount = target.employees * 0.10
        avg_cost_per_employee = 120000  # Fully loaded cost

        value_low = redundant_headcount * avg_cost_per_employee
        value_high = target.employees * 0.15 * avg_cost_per_employee

        synergies.append({
            'synergy_type': 'Cost - Consolidate Corporate Functions',
            'description': f'Eliminate duplicate HR, Finance, Legal, IT from {target.name}. Estimated {int(redundant_headcount)}-{int(target.employees * 0.15)} roles can be consolidated into {acquirer.name} shared services.',
            'value_low': int(value_low),
            'value_high': int(value_high),
            'confidence_level': 'high',
            'realization_timeline': '6-12 months',
            'status': 'IDENTIFIED',
            'company1_id': acquirer.id,
            'company2_id': target.id,
            'deal_id': deal.id,
        })

    # Pattern 3: Technology Consolidation
    acquirer_tech = acquirer.tech_stack or []
    target_tech = target.tech_stack or []

    if acquirer_tech and target_tech:
        # Check for different tech stacks
        different_stacks = set(target_tech) - set(acquirer_tech)
        if different_stacks:
            # Assume 5-10% of target's revenue as annual infrastructure cost
            infra_cost = target.revenue_usd * 0.05 if target.revenue_usd else 500000
            # Can save 20-40% by migrating to unified stack
            value_low = infra_cost * 0.20
            value_high = infra_cost * 0.40

            synergies.append({
                'synergy_type': 'Cost - Technology Stack Consolidation',
                'description': f'Migrate {target.name} from {", ".join(list(different_stacks)[:3])} to {acquirer.name}\'s stack ({", ".join(acquirer_tech[:3])}). Reduce redundant infrastructure and licensing costs.',
                'value_low': int(value_low),
                'value_high': int(value_high),
                'confidence_level': 'medium',
                'realization_timeline': '12-18 months',
                'status': 'IDENTIFIED',
                'company1_id': acquirer.id,
                'company2_id': target.id,
                'deal_id': deal.id,
            })

    # Pattern 4: Product Integration (if products complementary)
    acquirer_products = acquirer.products or []
    target_products = target.products or []

    if acquirer_products and target_products:
        # Assume integrated offering can command 10-20% price premium
        if target.revenue_usd:
            value_low = target.revenue_usd * 0.10
            value_high = target.revenue_usd * 0.20

            synergies.append({
                'synergy_type': 'Product - Integrated Offering',
                'description': f'Create unified product bundle combining {acquirer.name}\'s {acquirer_products[0]} with {target.name}\'s {target_products[0]}. Enables 10-20% price premium and competitive differentiation.',
                'value_low': int(value_low),
                'value_high': int(value_high),
                'confidence_level': 'low',
                'realization_timeline': '24-36 months',
                'status': 'IDENTIFIED',
                'company1_id': acquirer.id,
                'company2_id': target.id,
                'deal_id': deal.id,
            })

    # Pattern 5: Geographic Expansion
    acquirer_geo = acquirer.geography or []
    target_geo = target.geography or []

    if acquirer_geo and target_geo:
        # Check for acquirer presence where target isn't
        expansion_markets = set(acquirer_geo) - set(target_geo)
        if expansion_markets:
            # Assume can expand target's product to new markets
            # 50% of target's current revenue from new geos over 3 years
            if target.revenue_usd:
                value_low = target.revenue_usd * 0.30
                value_high = target.revenue_usd * 0.50

                synergies.append({
                    'synergy_type': 'Revenue - Geographic Expansion',
                    'description': f'Expand {target.name} into {", ".join(list(expansion_markets)[:2])} leveraging {acquirer.name}\'s existing presence. Target 30-50% revenue uplift over 3 years.',
                    'value_low': int(value_low),
                    'value_high': int(value_high),
                    'confidence_level': 'medium',
                    'realization_timeline': '24-36 months',
                    'status': 'IDENTIFIED',
                    'company1_id': acquirer.id,
                    'company2_id': target.id,
                    'deal_id': deal.id,
                })

    # Ensure we always return at least 3-4 synergies
    if len(synergies) < 3 and target.revenue_usd:
        # Add a generic "operational excellence" synergy
        value_low = target.revenue_usd * 0.05
        value_high = target.revenue_usd * 0.08

        synergies.append({
            'synergy_type': 'Cost - Operational Excellence',
            'description': f'Apply {acquirer.name}\'s best practices to {target.name} operations. Typical gains: procurement optimization, process automation, vendor consolidation.',
            'value_low': int(value_low),
            'value_high': int(value_high),
            'confidence_level': 'low',
            'realization_timeline': '12-24 months',
            'status': 'IDENTIFIED',
            'company1_id': acquirer.id,
            'company2_id': target.id,
            'deal_id': deal.id,
        })

    return synergies
