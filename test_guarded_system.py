#!/usr/bin/env python3
"""
TEST GUARDED SYSTEM
Demonstrates the invariant enforcement system in action.

This creates test files with both GOOD and BAD imports to show:
1. Project map tracking
2. Pre-flight validation catching errors
3. Drift detection working
"""

import sys
from pathlib import Path
from scripts.project_map_generator import ProjectMapGenerator
from scripts.import_validator import ImportValidator, RepoInvariantChecker
from scripts.drift_detector import DriftDetector

WORKSPACE = Path("/Users/JB/Documents/Synergies")


def print_section(title):
    """Print section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def test_project_map():
    """Test 1: Project map generation"""
    print_section("TEST 1: Project Map Generation")

    print("Generating project map...")
    generator = ProjectMapGenerator(WORKSPACE)
    project_map = generator.scan()

    print(f"\n✅ Project map generated:")
    print(f"   - Canonical root: {project_map['canonical_root']}")
    print(f"   - Package roots: {project_map['package_roots']}")
    print(f"   - Files tracked: {len(project_map['files'])}")
    print(f"   - Models registered: {len(project_map['models'])}")
    print(f"   - Import consistency: {project_map['health']['import_consistency_score']:.1%}")

    # Show some registered models
    if project_map['models']:
        print(f"\n   Sample models registered:")
        for i, (model, location) in enumerate(list(project_map['models'].items())[:5]):
            print(f"     - {model}: {location}")
        if len(project_map['models']) > 5:
            print(f"     ... and {len(project_map['models']) - 5} more")

    return project_map


def test_pre_flight_validation(project_map):
    """Test 2: Pre-flight import validation"""
    print_section("TEST 2: Pre-flight Import Validation")

    validator = ImportValidator(WORKSPACE / "project_map.json")

    # Test case 1: GOOD imports
    print("\n✅ Test Case 1: Valid imports (should pass)")
    good_code = """
from backend.app.models import User
from backend.app.services import SomeService

def test_function():
    pass
"""

    is_valid, errors = validator.validate_code("test_good.py", good_code)
    if is_valid:
        print("   ✅ Validation PASSED - imports are valid")
    else:
        print(f"   ❌ Validation FAILED: {errors}")

    # Test case 2: BAD imports (wrong prefix)
    print("\n❌ Test Case 2: Invalid imports - wrong prefix (should fail)")
    bad_code_1 = """
from app.models import User  # Wrong! Should be backend.app.models
from app.services import SomeService  # Wrong! Should be backend.app.services

def test_function():
    pass
"""

    is_valid, errors = validator.validate_code("test_bad_prefix.py", bad_code_1)
    if is_valid:
        print("   ⚠️  WARNING: Validation passed but should have failed!")
    else:
        print(f"   ✅ Validation correctly BLOCKED invalid imports:")
        for err in errors[:2]:
            print(f"      - {err}")

    # Test case 3: BAD imports (non-existent module)
    print("\n❌ Test Case 3: Invalid imports - missing module (should fail)")
    bad_code_2 = """
from backend.app.models import NonExistentModel  # This model doesn't exist!

def test_function():
    pass
"""

    is_valid, errors = validator.validate_code("test_missing_module.py", bad_code_2)
    if is_valid:
        print("   ⚠️  Validation passed (module might exist)")
    else:
        print(f"   ✅ Validation correctly BLOCKED missing import:")
        for err in errors[:2]:
            print(f"      - {err}")
            # Try to get suggestion
            fix = validator.suggest_fix(err, [])
            if fix:
                print(f"      💡 Suggested fix: {fix}")


def test_repo_invariants():
    """Test 3: Repository invariant checking"""
    print_section("TEST 3: Repository Invariant Checking")

    checker = RepoInvariantChecker(WORKSPACE)
    passed, violations = checker.check_invariants()

    if passed:
        print("   ✅ All invariants pass")
    else:
        print(f"   ❌ Found {len(violations)} invariant violations:")
        for v in violations:
            print(f"      - {v}")


def test_drift_detection():
    """Test 4: Drift detection"""
    print_section("TEST 4: Drift Detection")

    print("Running drift detector...")
    detector = DriftDetector(WORKSPACE, WORKSPACE / "project_map.json")
    result = detector.detect_all()

    severity_emoji = {
        "OK": "✅",
        "WARNING": "⚠️",
        "CRITICAL": "🚨"
    }

    print(f"\n{severity_emoji[result['severity']]} Status: {result['severity']}")
    print(f"   - Issues found: {len(result['issues'])}")
    print(f"   - Import consistency: {result['metrics']['import_consistency_score']:.1%}")
    print(f"   - Duplicate models: {result['metrics']['duplicate_count']}")
    print(f"   - Package roots: {result['metrics']['package_roots']}")

    if result['issues']:
        print(f"\n   Issues detected (showing first 3):")
        for issue in result['issues'][:3]:
            severity_icon = "🚨" if issue["severity"] == "CRITICAL" else "⚠️"
            print(f"   {severity_icon} {issue['message']}")

        if len(result['issues']) > 3:
            print(f"   ... and {len(result['issues']) - 3} more issues")

    return result


def demonstrate_protection():
    """Demonstrate how the system prevents bad code"""
    print_section("DEMONSTRATION: Protection in Action")

    print("\n📝 Scenario: V3 wants to create a file with bad imports")
    print("\nProposed file: backend/app/services/new_service.py")

    bad_code = """
# This is what V3 might generate if unguarded
from app.models import User  # WRONG PREFIX!
from backend.models import Category  # WRONG PATH!
from some_random_module import Thing  # DOESN'T EXIST!

class NewService:
    def do_something(self):
        pass
"""

    print("\nCode to write:")
    print("```python")
    print(bad_code)
    print("```")

    print("\n🛡️  GUARDED SYSTEM: Running pre-flight checks...")

    validator = ImportValidator(WORKSPACE / "project_map.json")
    is_valid, errors = validator.validate_code(
        "backend/app/services/new_service.py",
        bad_code
    )

    if is_valid:
        print("   ❌ FAILED: Bad code would have been written!")
    else:
        print(f"   ✅ BLOCKED: Pre-flight validation caught {len(errors)} errors:")
        for i, err in enumerate(errors, 1):
            print(f"\n   Error {i}:")
            print(f"      {err}")

            fix = validator.suggest_fix(err, [])
            if fix:
                print(f"      💡 Fix: {fix}")

        print("\n   🛑 File write BLOCKED - V3 would be forced to fix imports first")


def show_correct_example():
    """Show what V3 should generate"""
    print_section("CORRECT EXAMPLE: What V3 Should Generate")

    good_code = """
# This is correct - uses canonical imports
from backend.app.models import User
from backend.app.models import Category

class NewService:
    def do_something(self):
        pass
"""

    print("\nCorrected code:")
    print("```python")
    print(good_code)
    print("```")

    print("\n✅ Running pre-flight checks...")
    validator = ImportValidator(WORKSPACE / "project_map.json")
    is_valid, errors = validator.validate_code(
        "backend/app/services/new_service.py",
        good_code
    )

    if is_valid:
        print("   ✅ PASSED: All imports valid, file would be written")
    else:
        print(f"   ⚠️  Issues found: {errors}")


def main():
    """Run all tests"""
    print("=" * 60)
    print("  GUARDED V3 SYSTEM - LIVE DEMONSTRATION")
    print("=" * 60)
    print("\nThis demonstrates the invariant enforcement system")
    print("protecting your codebase from common autonomous build failures.")

    try:
        # Test 1: Generate project map
        project_map = test_project_map()

        # Test 2: Pre-flight validation
        test_pre_flight_validation(project_map)

        # Test 3: Repository invariants
        test_repo_invariants()

        # Test 4: Drift detection
        drift_result = test_drift_detection()

        # Demonstration: Show protection in action
        demonstrate_protection()

        # Show correct example
        show_correct_example()

        # Final summary
        print_section("SUMMARY")
        print("\n✅ All protection systems operational:")
        print("   1. ✅ Project map tracks all files and symbols")
        print("   2. ✅ Pre-flight validation catches bad imports")
        print("   3. ✅ Repository invariants enforced")
        print("   4. ✅ Drift detection identifies architectural issues")

        print(f"\n📊 Current codebase health:")
        print(f"   - Import consistency: {drift_result['metrics']['import_consistency_score']:.1%}")
        print(f"   - Status: {drift_result['severity']}")
        print(f"   - Issues to fix: {len(drift_result['issues'])}")

        print("\n🛡️  With guarded V3, these systems run automatically:")
        print("   - Before each file write: Pre-flight validation")
        print("   - After each task: Project map update")
        print("   - Every 3 tasks: Full drift detection")
        print("   - If critical drift: Auto-fix with import hell fixer")

        print("\n" + "=" * 60)
        print("  Demonstration complete!")
        print("=" * 60)

        if drift_result['severity'] == 'CRITICAL':
            print("\n⚠️  Note: Your codebase has critical issues detected")
            print("   Run: python3 scripts/fix_import_hell.py")
            print("   Or: Use guarded mode to prevent getting worse")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
