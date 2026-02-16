"""
Verification script to test models package structure.
Run this before deleting the old models.py file.

Usage:
    cd backend
    python -m app.models.verification_test
"""

def verify_imports():
    """Verify all model imports work correctly."""
    print('Testing model imports...')
    try:
        from backend.app.models import Company, Synergy, SynergyMetric
        print('✓ Direct imports successful')
        from backend.app.models.company import Company as CompanyDirect
        from backend.app.models.synergy import Synergy as SynergyDirect
        from backend.app.models.synergy import SynergyMetric as SynergyMetricDirect
        print('✓ Module-level imports successful')
        assert Company is CompanyDirect, 'Company class mismatch'
        assert Synergy is SynergyDirect, 'Synergy class mismatch'
        assert SynergyMetric is SynergyMetricDirect, 'SynergyMetric class mismatch'
        print('✓ Class identity verification passed')
        assert hasattr(Company, '__tablename__'), 'Company missing __tablename__'
        assert hasattr(Synergy, 'company1_id'), 'Synergy missing company1_id'
        assert hasattr(SynergyMetric, 'synergy_id'), 'SynergyMetric missing synergy_id'
        print('✓ Model attributes present')
        assert hasattr(Synergy, 'metrics'), 'Synergy missing metrics relationship'
        assert hasattr(Company, 'synergies_as_company1'), 'Company missing synergies_as_company1'
        assert hasattr(Company, 'synergies_as_company2'), 'Company missing synergies_as_company2'
        print('✓ Relationships defined')
        assert hasattr(Company, 'to_dict'), 'Company missing to_dict method'
        assert hasattr(Synergy, 'to_dict'), 'Synergy missing to_dict method'
        assert hasattr(SynergyMetric, 'to_dict'), 'SynergyMetric missing to_dict method'
        print('✓ Model methods present')
        print('\n✅ All verification tests passed!')
        print('\nSafe to delete backend/app/models.py')
        return True
    except Exception as e:
        print(f'\n❌ Verification failed: {e}')
        import traceback
        traceback.print_exc()
        return False
if __name__ == '__main__':
    import sys
    success = verify_imports()
    sys.exit(0 if success else 1)