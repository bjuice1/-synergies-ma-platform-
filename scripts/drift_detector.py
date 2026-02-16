#!/usr/bin/env python3
"""
DRIFT DETECTOR
Runs after tasks to detect architectural drift before it becomes critical.

Catches:
- Import inconsistency
- Duplicate models
- New package roots
- Circular dependencies
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict


class DriftDetector:
    """Detect architectural drift early"""

    def __init__(self, workspace: Path, project_map_path: Path):
        self.workspace = workspace
        self.project_map_path = project_map_path
        self.project_map = self._load_project_map()

        # Thresholds
        self.IMPORT_CONSISTENCY_THRESHOLD = 0.95  # 95%+ imports should use same prefix
        self.CRITICAL_DUPLICATE_MODELS = {'User', 'Task', 'Category', 'Industry', 'Function', 'Synergy'}

    def _load_project_map(self) -> Dict:
        """Load latest project map"""
        if not self.project_map_path.exists():
            print(f"⚠️  Project map not found: {self.project_map_path}")
            return {}

        with open(self.project_map_path) as f:
            return json.load(f)

    def detect_all(self) -> Dict[str, any]:
        """
        Run all drift detectors.

        Returns: {
            "passed": bool,
            "severity": "OK" | "WARNING" | "CRITICAL",
            "issues": [...]
        }
        """
        issues = []

        # Detector 1: Import Consistency Score
        ics_issue = self._check_import_consistency()
        if ics_issue:
            issues.append(ics_issue)

        # Detector 2: Duplicate Models
        dup_issues = self._check_duplicate_models()
        issues.extend(dup_issues)

        # Detector 3: New Package Roots
        root_issue = self._check_new_package_roots()
        if root_issue:
            issues.append(root_issue)

        # Detector 4: Import Style Entropy
        entropy_issue = self._check_import_entropy()
        if entropy_issue:
            issues.append(entropy_issue)

        # Determine overall severity
        severity = "OK"
        if any(i["severity"] == "CRITICAL" for i in issues):
            severity = "CRITICAL"
        elif any(i["severity"] == "WARNING" for i in issues):
            severity = "WARNING"

        return {
            "passed": len(issues) == 0,
            "severity": severity,
            "issues": issues,
            "metrics": {
                "import_consistency_score": self.project_map.get("health", {}).get("import_consistency_score", 1.0),
                "duplicate_count": len(self.project_map.get("duplicates", [])),
                "package_roots": len(self.project_map.get("package_roots", []))
            }
        }

    def _check_import_consistency(self) -> Dict:
        """Check Import Consistency Score"""
        ics = self.project_map.get("health", {}).get("import_consistency_score", 1.0)

        if ics < self.IMPORT_CONSISTENCY_THRESHOLD:
            prefixes = self.project_map.get("health", {}).get("import_prefixes", {})
            prefix_str = ", ".join(f"{k}: {v}" for k, v in prefixes.items())

            return {
                "type": "import_consistency",
                "severity": "CRITICAL" if ics < 0.80 else "WARNING",
                "score": ics,
                "message": f"Import consistency score: {ics:.1%} (threshold: {self.IMPORT_CONSISTENCY_THRESHOLD:.0%})",
                "details": f"Multiple import prefixes detected: {prefix_str}",
                "fix": "Run import canonicalization: python3 scripts/fix_imports.py"
            }

        return None

    def _check_duplicate_models(self) -> List[Dict]:
        """Check for duplicate model definitions"""
        issues = []

        duplicates = self.project_map.get("duplicates", [])

        for dup in duplicates:
            symbol = dup["symbol"]
            locations = dup["locations"]

            # Critical if it's a core domain model
            is_critical = symbol in self.CRITICAL_DUPLICATE_MODELS

            issues.append({
                "type": "duplicate_model",
                "severity": "CRITICAL" if is_critical else "WARNING",
                "symbol": symbol,
                "locations": locations,
                "message": f"Duplicate model '{symbol}' in {len(locations)} locations",
                "details": f"Found in: {', '.join(locations)}",
                "fix": f"Remove duplicates - keep only one canonical definition"
            })

        return issues

    def _check_new_package_roots(self) -> Dict:
        """Check if new package roots appeared (architectural drift)"""
        current_roots = set(self.project_map.get("package_roots", []))

        # Filter out archived/backup directories
        current_roots = {r for r in current_roots if not (r.startswith('archived') or r.startswith('backup') or r.startswith('app_archived'))}

        # Define expected roots
        expected_roots = {"backend", "tests"}  # Adjust based on your project

        unexpected_roots = current_roots - expected_roots

        if unexpected_roots:
            return {
                "type": "new_package_root",
                "severity": "CRITICAL",
                "roots": list(unexpected_roots),
                "message": f"Unexpected package roots detected: {', '.join(unexpected_roots)}",
                "details": "New top-level packages can cause import confusion",
                "fix": "Review and consolidate into existing package structure"
            }

        return None

    def _check_import_entropy(self) -> Dict:
        """Check import style entropy (number of different import prefixes)"""
        prefixes = self.project_map.get("health", {}).get("import_prefixes", {})

        # More than 2 prefixes for internal imports = problem
        internal_prefixes = {k: v for k, v in prefixes.items() if k in ['backend', 'app', 'frontend']}

        if len(internal_prefixes) > 1:
            return {
                "type": "import_entropy",
                "severity": "WARNING",
                "prefixes": internal_prefixes,
                "message": f"Multiple internal import styles: {', '.join(internal_prefixes.keys())}",
                "details": f"Counts: {internal_prefixes}",
                "fix": "Standardize on single import prefix (use canonical root)"
            }

        return None


class HealthMetrics:
    """Track health metrics over time"""

    def __init__(self, workspace: Path):
        self.workspace = workspace
        self.history_file = workspace / "drift_history.json"
        self.history = self._load_history()

    def _load_history(self) -> List[Dict]:
        """Load drift detection history"""
        if not self.history_file.exists():
            return []

        with open(self.history_file) as f:
            return json.load(f)

    def record(self, result: Dict):
        """Record drift detection result"""
        from datetime import datetime

        entry = {
            "timestamp": datetime.now().isoformat(),
            "severity": result["severity"],
            "issue_count": len(result["issues"]),
            "metrics": result["metrics"]
        }

        self.history.append(entry)

        # Keep last 100 entries
        self.history = self.history[-100:]

        with open(self.history_file, 'w') as f:
            json.dump(self.history, f, indent=2)

    def get_trend(self) -> str:
        """Analyze trend (improving, stable, degrading)"""
        if len(self.history) < 3:
            return "insufficient_data"

        recent = self.history[-3:]

        # Check import consistency trend
        ics_trend = [h["metrics"]["import_consistency_score"] for h in recent]

        if ics_trend[-1] < ics_trend[0] - 0.05:
            return "degrading"
        elif ics_trend[-1] > ics_trend[0] + 0.05:
            return "improving"
        else:
            return "stable"


def print_report(result: Dict):
    """Print formatted drift detection report"""
    severity_emoji = {
        "OK": "✅",
        "WARNING": "⚠️",
        "CRITICAL": "🚨"
    }

    print("=" * 60)
    print("DRIFT DETECTION REPORT")
    print("=" * 60)

    print(f"\nStatus: {severity_emoji[result['severity']]} {result['severity']}")
    print(f"Issues Found: {len(result['issues'])}")

    print("\n📊 Metrics:")
    metrics = result["metrics"]
    print(f"   - Import Consistency: {metrics['import_consistency_score']:.1%}")
    print(f"   - Duplicate Models: {metrics['duplicate_count']}")
    print(f"   - Package Roots: {metrics['package_roots']}")

    if result["issues"]:
        print("\n🔍 Issues Detected:")
        for i, issue in enumerate(result["issues"], 1):
            sev_icon = "🚨" if issue["severity"] == "CRITICAL" else "⚠️"
            print(f"\n   {i}. [{sev_icon} {issue['severity']}] {issue['message']}")
            print(f"      {issue['details']}")
            if issue.get("fix"):
                print(f"      💡 Fix: {issue['fix']}")
    else:
        print("\n✅ No drift detected - architecture is healthy")

    print("\n" + "=" * 60)


def main():
    """Run drift detection"""
    workspace = Path("/Users/JB/Documents/Synergies")
    map_path = workspace / "project_map.json"

    print("Running drift detector...")
    print()

    detector = DriftDetector(workspace, map_path)
    result = detector.detect_all()

    print_report(result)

    # Record to history
    metrics = HealthMetrics(workspace)
    metrics.record(result)
    trend = metrics.get_trend()

    print(f"\n📈 Trend: {trend.upper()}")

    # Exit with error code if critical
    if result["severity"] == "CRITICAL":
        print("\n🛑 CRITICAL issues detected - fix before continuing")
        sys.exit(1)
    elif result["severity"] == "WARNING":
        print("\n⚠️  Warnings detected - address soon")
        sys.exit(0)
    else:
        print("\n✅ All checks pass")
        sys.exit(0)


if __name__ == "__main__":
    main()
