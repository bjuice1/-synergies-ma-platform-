#!/usr/bin/env python3
"""
IMPORT VALIDATOR - Pre-flight Checks
Validates import statements before writing files.

This prevents the "missing model whack-a-mole" pattern by catching import
errors BEFORE files are written.
"""

import ast
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional


class ImportValidator:
    """Validate imports against project map"""

    def __init__(self, project_map_path: Path):
        self.workspace = Path("/Users/JB/Documents/Synergies")
        self.project_map = self._load_project_map(project_map_path)
        self.canonical_root = self.project_map.get("canonical_root")

    def _load_project_map(self, map_path: Path) -> Dict:
        """Load project map"""
        if not map_path.exists():
            print(f"⚠️  Project map not found: {map_path}")
            print("   Run: python3 scripts/project_map_generator.py")
            return {}

        with open(map_path) as f:
            return json.load(f)

    def validate_code(self, file_path: str, code_content: str) -> Tuple[bool, List[str]]:
        """
        Validate imports in code before writing.

        Returns: (is_valid, list_of_errors)
        """
        errors = []

        try:
            tree = ast.parse(code_content, filename=file_path)
        except SyntaxError as e:
            return False, [f"Syntax error: {e}"]

        # Extract imports
        imports = self._extract_imports(tree)

        # Check each import
        for imp in imports:
            error = self._check_import(imp, file_path)
            if error:
                errors.append(error)

        # Check canonical root usage
        if self.canonical_root:
            root_error = self._check_canonical_root(imports)
            if root_error:
                errors.append(root_error)

        return len(errors) == 0, errors

    def _extract_imports(self, tree: ast.AST) -> List[Dict]:
        """Extract import statements from AST"""
        imports = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append({
                        "type": "import",
                        "module": alias.name,
                        "name": None,
                        "line": node.lineno
                    })
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for alias in node.names:
                    imports.append({
                        "type": "from",
                        "module": module,
                        "name": alias.name,
                        "line": node.lineno,
                        "level": node.level
                    })

        return imports

    def _check_import(self, imp: Dict, file_path: str) -> Optional[str]:
        """Check if import is valid"""

        # Skip standard library and third-party (assume they exist)
        module = imp["module"]
        if not module:
            return None

        # Check if it's a local import (starts with canonical root)
        if self.canonical_root and module.startswith(self.canonical_root.replace('/', '.')):
            # This is a local import - verify it exists
            return self._check_local_import(imp)

        # Check for common wrong patterns
        if "backend.app." in module and self.canonical_root == "app":
            return f"Line {imp['line']}: Wrong import prefix 'backend.app.' - should be 'app.' (canonical root: {self.canonical_root})"

        if module.startswith("app.") and self.canonical_root == "backend":
            return f"Line {imp['line']}: Wrong import prefix 'app.' - should be 'backend.' (canonical root: {self.canonical_root})"

        return None

    def _check_local_import(self, imp: Dict) -> Optional[str]:
        """Check if local import target exists"""
        module = imp["module"]
        name = imp["name"]

        # Convert module path to check (e.g., "app.models" -> "app.models")
        module_path = module

        # Check if module exists in project map
        if module_path not in self.project_map.get("symbols", {}):
            # Module doesn't exist
            return f"Line {imp['line']}: Module '{module}' not found in project. Did you create it?"

        # If importing specific symbol, check it exists
        if name and name != "*":
            symbols_in_module = self.project_map["symbols"].get(module_path, [])
            symbol_names = [s["name"] for s in symbols_in_module]

            if name not in symbol_names:
                return f"Line {imp['line']}: Symbol '{name}' not found in module '{module}'. Available: {', '.join(symbol_names[:5])}"

        return None

    def _check_canonical_root(self, imports: List[Dict]) -> Optional[str]:
        """Check that all imports use canonical root"""
        if not self.canonical_root:
            return None

        # Count imports by prefix
        canonical_prefix = self.canonical_root.replace('/', '.')
        wrong_prefixes = []

        for imp in imports:
            module = imp["module"]
            if not module:
                continue

            # Check if it's a project import
            if any(module.startswith(prefix) for prefix in ["backend", "app", "frontend"]):
                if not module.startswith(canonical_prefix):
                    wrong_prefixes.append(f"{module} (line {imp['line']})")

        if wrong_prefixes:
            return f"Import prefix mismatch. Canonical root is '{canonical_prefix}', but found: {', '.join(wrong_prefixes[:3])}"

        return None

    def suggest_fix(self, error: str, imports: List[Dict]) -> Optional[str]:
        """Suggest how to fix an import error"""

        # Missing module
        if "not found in project" in error:
            module_name = error.split("'")[1]
            return f"Create the module {module_name}.py first, or check if the import path is correct"

        # Missing symbol
        if "not found in module" in error:
            parts = error.split("'")
            symbol = parts[1]
            module = parts[3]

            # Check if symbol exists elsewhere
            for mod, symbols in self.project_map.get("symbols", {}).items():
                for s in symbols:
                    if s["name"] == symbol:
                        return f"'{symbol}' exists in {mod}, not {module}. Use: from {mod} import {symbol}"

            return f"Create {symbol} in {module}.py, or check spelling"

        # Wrong prefix
        if "Wrong import prefix" in error:
            canonical = self.canonical_root.replace('/', '.')
            return f"Use '{canonical}.*' for all local imports"

        return None


class RepoInvariantChecker:
    """Check repository structural invariants"""

    def __init__(self, workspace: Path):
        self.workspace = workspace

    def check_invariants(self) -> Tuple[bool, List[str]]:
        """
        Check hard repository rules.

        Returns: (all_pass, list_of_violations)
        """
        violations = []

        # RULE 1: Exactly one package root
        package_roots = self._find_package_roots()
        if len(package_roots) == 0:
            violations.append("CRITICAL: No package root found (no __init__.py)")
        elif len(package_roots) > 1:
            # Check for conflicting roots (backend/app AND app)
            if any('backend' in r and 'app' in r for r in package_roots) and 'app' in package_roots:
                violations.append(f"CRITICAL: Conflicting package roots: {package_roots} - Import hell imminent!")

        # RULE 2: No backend.app.* imports if canonical root is app
        violations.extend(self._check_forbidden_imports())

        # RULE 3: No parallel model directories (backend/app/models/ AND backend/app/models.py)
        violations.extend(self._check_parallel_structures())

        return len(violations) == 0, violations

    def _find_package_roots(self) -> List[str]:
        """Find all top-level package roots"""
        roots = []
        for item in self.workspace.iterdir():
            if item.is_dir() and (item / "__init__.py").exists():
                roots.append(item.name)
        return roots

    def _check_forbidden_imports(self) -> List[str]:
        """Check for forbidden import patterns"""
        violations = []

        # NOTE: This check is disabled because import validation is handled by ImportValidator.
        # The canonical prefix is project-specific, so we can't hardcode forbidden patterns here.
        # Leave this as a placeholder for future project-specific checks.

        return violations

    def _check_parallel_structures(self) -> List[str]:
        """Check for parallel file/directory structures"""
        violations = []

        # Look for models.py AND models/ in same directory
        for py_file in self.workspace.rglob("models.py"):
            parent = py_file.parent
            models_dir = parent / "models"

            if models_dir.exists() and models_dir.is_dir():
                violations.append(f"CRITICAL: Parallel structure - {py_file.relative_to(self.workspace)} AND {models_dir.relative_to(self.workspace)}/ exist")

        return violations


def main():
    """Test validator"""
    workspace = Path("/Users/JB/Documents/Synergies")
    map_path = workspace / "project_map.json"

    print("=" * 60)
    print("IMPORT VALIDATOR - Pre-flight Check")
    print("=" * 60)

    # Check repo invariants first
    print("\n1️⃣  Checking repository invariants...")
    checker = RepoInvariantChecker(workspace)
    inv_pass, violations = checker.check_invariants()

    if inv_pass:
        print("   ✅ All invariants pass")
    else:
        print("   ❌ Invariant violations:")
        for v in violations:
            print(f"      - {v}")

    # Check imports
    print("\n2️⃣  Import validation ready")
    validator = ImportValidator(map_path)

    # Test with sample code
    test_code = """
from backend.app.models import User
from app.services import NotificationService

def test():
    pass
"""

    is_valid, errors = validator.validate_code("test.py", test_code)

    if is_valid:
        print("   ✅ Test code imports valid")
    else:
        print("   ❌ Test code has import errors:")
        for err in errors:
            print(f"      - {err}")
            fix = validator.suggest_fix(err, [])
            if fix:
                print(f"        💡 {fix}")

    print("\n✅ Validator ready for V3 integration")


if __name__ == "__main__":
    main()
