#!/usr/bin/env python3
"""
UNLIMITED V3 - GUARDED EDITION
Same as V3 but with the new invariant enforcement systems integrated:

NEW FEATURES:
1. project_map.json updated after each task
2. Pre-flight import validation before writing files
3. Drift detection after every 3 tasks
4. Auto-remediation with import_hell fixer

This prevents the three major failure modes:
- Import hell spiral
- Missing model whack-a-mole
- Architectural drift
"""

import os
import sys
import json
import subprocess
from pathlib import Path

# Import the base V3 system
sys.path.insert(0, str(Path(__file__).parent))

# Import new tools
from scripts.project_map_generator import ProjectMapGenerator
from scripts.import_validator import ImportValidator, RepoInvariantChecker
from scripts.drift_detector import DriftDetector, HealthMetrics

# Get the original V3 script
import launch_unlimited_v3 as v3_base

WORKSPACE = Path("/Users/JB/Documents/Synergies")
PROJECT_MAP_FILE = WORKSPACE / "project_map.json"
DRIFT_CHECK_INTERVAL = 3  # Check drift every N tasks


class GuardedV3:
    """V3 with invariant enforcement"""

    def __init__(self):
        self.workspace = WORKSPACE
        self.project_map_path = PROJECT_MAP_FILE
        self.tasks_since_drift_check = 0

        # Initialize tools
        self._init_project_map()
        self.validator = ImportValidator(self.project_map_path)
        self.invariant_checker = RepoInvariantChecker(self.workspace)

    def _init_project_map(self):
        """Initialize or update project map"""
        print("🗺️  Initializing project map...")
        generator = ProjectMapGenerator(self.workspace)
        generator.scan()
        generator.save(self.project_map_path)

    def update_project_map(self):
        """Update project map after task completion"""
        print("🔄 Updating project map...")
        self._init_project_map()

    def validate_code_before_write(self, file_path: str, code_content: str) -> tuple[bool, list]:
        """
        Pre-flight validation before writing file.
        Returns: (is_valid, errors)
        """
        # Check repo invariants first
        inv_pass, violations = self.invariant_checker.check_invariants()
        if not inv_pass:
            print("🚨 REPO INVARIANT VIOLATION DETECTED:")
            for v in violations:
                print(f"   - {v}")
            return False, violations

        # Check imports
        is_valid, errors = self.validator.validate_code(file_path, code_content)

        if not is_valid:
            print(f"❌ Import validation failed for {file_path}:")
            for err in errors:
                print(f"   - {err}")
                # Try to suggest fix
                fix = self.validator.suggest_fix(err, [])
                if fix:
                    print(f"     💡 {fix}")

        return is_valid, errors

    def check_drift(self) -> dict:
        """
        Check for architectural drift.
        Returns: drift_result dict
        """
        print("\n🔍 Running drift detection...")

        detector = DriftDetector(self.workspace, self.project_map_path)
        result = detector.detect_all()

        # Record to history
        metrics = HealthMetrics(self.workspace)
        metrics.record(result)

        # Print summary
        if result["severity"] == "OK":
            print("   ✅ No drift detected")
        elif result["severity"] == "WARNING":
            print(f"   ⚠️  {len(result['issues'])} warnings detected")
            for issue in result["issues"]:
                print(f"      - {issue['message']}")
        else:  # CRITICAL
            print(f"   🚨 {len(result['issues'])} CRITICAL issues!")
            for issue in result["issues"]:
                print(f"      - {issue['message']}")
                print(f"        Fix: {issue.get('fix', 'Manual review needed')}")

        return result

    def run_import_hell_fixer(self):
        """Run the import hell fix tool automatically"""
        print("\n🔧 Running automatic import hell fix...")

        try:
            result = subprocess.run(
                ["python3", "scripts/fix_import_hell.py"],
                cwd=str(self.workspace),
                capture_output=True,
                text=True,
                timeout=300,
                input="y\n"  # Auto-confirm
            )

            if result.returncode == 0:
                print("   ✅ Import hell fix completed")
                return True
            else:
                print(f"   ❌ Fix failed: {result.stderr}")
                return False

        except Exception as e:
            print(f"   ❌ Fix error: {e}")
            return False


# Monkey-patch V3's write_code_file function to add validation
original_write_code_file = v3_base.write_code_file
guarded_v3 = GuardedV3()


def guarded_write_code_file(file_path, content):
    """
    Guarded version of write_code_file with pre-flight validation
    """
    # Pre-flight validation
    is_valid, errors = guarded_v3.validate_code_before_write(file_path, content)

    if not is_valid:
        v3_base.logger.log(f"❌ PRE-FLIGHT VALIDATION FAILED: {file_path}", "ERROR")
        v3_base.logger.log(f"   Errors: {errors}", "ERROR")

        # Log to AGENTS.md
        v3_base.update_agents_md(
            f"Pre-flight validation blocked write to {file_path}: {errors[0][:100]}",
            section="Gotchas"
        )

        return False

    # Original write
    return original_write_code_file(file_path, content)


# Monkey-patch the function
v3_base.write_code_file = guarded_write_code_file


# Monkey-patch task completion to add hooks
original_mark_completed = v3_base.Checkpoint.mark_completed


def guarded_mark_completed(self, task_id, complexity, approach):
    """
    Guarded version that runs post-task checks
    """
    # Original behavior
    original_mark_completed(self, task_id, complexity, approach)

    # POST-TASK HOOKS

    # 1. Update project map after each task
    v3_base.logger.log("🗺️  Updating project map after task completion...")
    guarded_v3.update_project_map()

    # 2. Check drift every N tasks
    guarded_v3.tasks_since_drift_check += 1

    if guarded_v3.tasks_since_drift_check >= DRIFT_CHECK_INTERVAL:
        drift_result = guarded_v3.check_drift()

        guarded_v3.tasks_since_drift_check = 0

        # If critical drift detected, trigger auto-fix
        if drift_result["severity"] == "CRITICAL":
            v3_base.logger.log("🚨 CRITICAL DRIFT DETECTED", "ERROR")

            # Check if it's import-related
            has_import_issues = any(
                issue["type"] in ["import_consistency", "import_entropy"]
                for issue in drift_result["issues"]
            )

            if has_import_issues:
                v3_base.logger.log("🔧 Attempting automatic import fix...", "WARN")
                fix_success = guarded_v3.run_import_hell_fixer()

                if fix_success:
                    # Re-update project map and check drift
                    guarded_v3.update_project_map()
                    new_result = guarded_v3.check_drift()

                    if new_result["severity"] != "CRITICAL":
                        v3_base.logger.log("✅ Import fix successful - continuing", "INFO")
                    else:
                        v3_base.logger.log("❌ Import fix insufficient - STOPPING", "ERROR")
                        # Create stop file
                        (WORKSPACE / "STOP_NOW").touch()
                else:
                    v3_base.logger.log("❌ Auto-fix failed - STOPPING", "ERROR")
                    (WORKSPACE / "STOP_NOW").touch()


# Monkey-patch
v3_base.Checkpoint.mark_completed = guarded_mark_completed


def main():
    """Run V3 with guards"""
    print("=" * 60)
    print("🛡️  UNLIMITED V3 - GUARDED EDITION")
    print("=" * 60)
    print("Protection systems:")
    print("  ✅ Project map tracking")
    print("  ✅ Pre-flight import validation")
    print("  ✅ Drift detection (every 3 tasks)")
    print("  ✅ Auto-remediation (import hell fixer)")
    print("=" * 60)
    print()

    # Initialize project map
    print("📋 Initial setup...")
    guarded_v3._init_project_map()

    # Check initial state
    print("🔍 Checking initial architecture health...")
    inv_pass, violations = guarded_v3.invariant_checker.check_invariants()

    if not inv_pass:
        print("⚠️  Initial invariant violations detected:")
        for v in violations:
            print(f"   - {v}")
        print()

        response = input("Continue anyway? [y/N]: ")
        if response.lower() != 'y':
            print("Aborted - fix violations first")
            sys.exit(1)

    # Run V3
    print("\n🚀 Starting guarded autonomous build...\n")
    v3_base.main()


if __name__ == "__main__":
    main()
