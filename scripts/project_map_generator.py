#!/usr/bin/env python3
"""
PROJECT MAP GENERATOR
Scans codebase and generates project_map.json - the "world model" for V3.

This is the missing invariant enforcement system that prevents:
- Import hell (tracks canonical import paths)
- Missing models (symbol registry)
- Architectural drift (package structure monitoring)
"""

import ast
import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple
from datetime import datetime
from collections import defaultdict


class ProjectMapGenerator:
    """Generate comprehensive project map from Python codebase"""

    def __init__(self, workspace_path: Path):
        self.workspace = Path(workspace_path)
        self.map = {
            "generated_at": None,
            "package_roots": [],
            "canonical_root": None,
            "files": {},
            "symbols": {},  # module_path -> [symbols]
            "imports": {},  # file_path -> [import statements]
            "import_graph": [],  # [(from_file, to_file, symbol)]
            "models": {},  # model_name -> canonical_location
            "routes": {},  # endpoint -> handler_info
            "duplicates": [],  # [(symbol, [locations])]
            "health": {
                "import_consistency_score": 0.0,
                "duplicate_count": 0,
                "circular_imports": [],
                "unresolved_imports": []
            }
        }

    def scan(self) -> Dict:
        """Full scan of codebase"""
        print("🔍 Scanning codebase...")

        # Step 1: Find package roots
        self._find_package_roots()

        # Step 2: Scan all Python files
        python_files = list(self.workspace.rglob("*.py"))
        print(f"   Found {len(python_files)} Python files")

        for py_file in python_files:
            # Skip node_modules, venv, etc.
            if self._should_skip(py_file):
                continue

            self._scan_file(py_file)

        # Step 3: Analyze patterns
        self._detect_duplicates()
        self._analyze_import_health()
        self._find_models()
        self._find_routes()

        # Step 4: Set metadata
        self.map["generated_at"] = datetime.now().isoformat()

        print(f"✅ Scan complete:")
        print(f"   - {len(self.map['files'])} files tracked")
        print(f"   - {len(self.map['symbols'])} modules with exports")
        print(f"   - {len(self.map['models'])} domain models")
        print(f"   - {len(self.map['duplicates'])} duplicate symbols")
        print(f"   - Import consistency: {self.map['health']['import_consistency_score']:.1%}")

        return self.map

    def _should_skip(self, path: Path) -> bool:
        """Skip non-relevant paths"""
        skip_dirs = {
            'node_modules', 'venv', '.venv', '__pycache__',
            '.git', 'dist', 'build', '.pytest_cache', '.mypy_cache'
        }

        # Skip any directory starting with 'archived' or 'backup'
        for part in path.parts:
            if part.startswith('archived') or part.startswith('backup') or part.startswith('app_archived'):
                return True
            if part in skip_dirs:
                return True

        return False

    def _find_package_roots(self):
        """Find Python package roots (dirs with __init__.py)"""
        roots = []

        # Look for top-level packages
        for item in self.workspace.iterdir():
            if item.is_dir() and (item / "__init__.py").exists():
                # Skip archived/backup directories
                name = item.name
                if name.startswith('archived') or name.startswith('backup') or name.startswith('app_archived'):
                    continue
                roots.append(str(item.relative_to(self.workspace)))

        self.map["package_roots"] = sorted(roots)

        # Determine canonical root (prefer 'backend/app' or 'app')
        if "backend" in roots:
            # Check if backend/app exists
            if (self.workspace / "backend" / "app" / "__init__.py").exists():
                self.map["canonical_root"] = "backend/app"
            else:
                self.map["canonical_root"] = "backend"
        elif "app" in roots:
            self.map["canonical_root"] = "app"
        elif roots:
            self.map["canonical_root"] = roots[0]
        else:
            self.map["canonical_root"] = None
            print("⚠️  WARNING: No package root found!")

        print(f"   Package roots: {self.map['package_roots']}")
        print(f"   Canonical root: {self.map['canonical_root']}")

    def _scan_file(self, file_path: Path):
        """Scan single Python file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            tree = ast.parse(content, filename=str(file_path))

            rel_path = str(file_path.relative_to(self.workspace))

            # Track file
            self.map["files"][rel_path] = {
                "size": len(content),
                "lines": len(content.splitlines()),
                "modified": file_path.stat().st_mtime
            }

            # Extract imports
            imports = self._extract_imports(tree)
            if imports:
                self.map["imports"][rel_path] = imports

            # Extract symbols (classes, functions)
            symbols = self._extract_symbols(tree)
            if symbols:
                module_path = self._file_to_module_path(rel_path)
                self.map["symbols"][module_path] = symbols

        except Exception as e:
            print(f"⚠️  Failed to scan {file_path.name}: {e}")

    def _extract_imports(self, tree: ast.AST) -> List[Dict]:
        """Extract all import statements"""
        imports = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append({
                        "type": "import",
                        "module": alias.name,
                        "alias": alias.asname
                    })
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for alias in node.names:
                    imports.append({
                        "type": "from",
                        "module": module,
                        "name": alias.name,
                        "alias": alias.asname,
                        "level": node.level  # relative import dots
                    })

        return imports

    def _extract_symbols(self, tree: ast.AST) -> List[Dict]:
        """Extract exported symbols (classes, functions, constants)"""
        symbols = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                # Detect if it's a model (inherits from db.Model, Base, etc.)
                is_model = any(
                    (isinstance(base, ast.Name) and base.id in ['Model', 'Base']) or
                    (isinstance(base, ast.Attribute) and base.attr == 'Model')
                    for base in node.bases
                )

                symbols.append({
                    "type": "class",
                    "name": node.name,
                    "is_model": is_model,
                    "bases": [self._base_name(b) for b in node.bases]
                })

            elif isinstance(node, ast.FunctionDef):
                # Skip internal functions
                if not node.name.startswith('_'):
                    symbols.append({
                        "type": "function",
                        "name": node.name,
                        "decorators": [self._decorator_name(d) for d in node.decorator_list]
                    })

        return symbols

    def _base_name(self, base: ast.AST) -> str:
        """Extract base class name"""
        if isinstance(base, ast.Name):
            return base.id
        elif isinstance(base, ast.Attribute):
            return base.attr
        return "Unknown"

    def _decorator_name(self, dec: ast.AST) -> str:
        """Extract decorator name"""
        if isinstance(dec, ast.Name):
            return dec.id
        elif isinstance(dec, ast.Attribute):
            return dec.attr
        elif isinstance(dec, ast.Call):
            return self._decorator_name(dec.func)
        return "Unknown"

    def _file_to_module_path(self, file_path: str) -> str:
        """Convert file path to Python module path"""
        # Remove .py extension
        module = file_path.replace('.py', '')
        # Convert slashes to dots
        module = module.replace('/', '.')
        # Remove __init__
        module = module.replace('.__init__', '')
        return module

    def _detect_duplicates(self):
        """Find duplicate symbol definitions"""
        symbol_locations = defaultdict(list)

        # Collect all symbols and their locations
        for module_path, symbols in self.map["symbols"].items():
            for symbol in symbols:
                if symbol["type"] == "class":
                    name = symbol["name"]
                    symbol_locations[name].append(module_path)

        # Find duplicates
        for symbol_name, locations in symbol_locations.items():
            if len(locations) > 1:
                self.map["duplicates"].append({
                    "symbol": symbol_name,
                    "locations": locations,
                    "severity": "CRITICAL" if symbol_name in ['User', 'Task', 'Category'] else "WARNING"
                })

        self.map["health"]["duplicate_count"] = len(self.map["duplicates"])

    def _analyze_import_health(self):
        """Calculate import consistency score"""
        if not self.map["imports"]:
            self.map["health"]["import_consistency_score"] = 1.0
            return

        # Count import prefixes
        prefix_counts = defaultdict(int)
        total_imports = 0

        for file_path, imports in self.map["imports"].items():
            for imp in imports:
                if imp["type"] == "from":
                    module = imp["module"]
                    # Get first part (e.g., "backend" from "backend.app.models")
                    if module:
                        prefix = module.split('.')[0]
                        prefix_counts[prefix] += 1
                        total_imports += 1

        # Calculate entropy (lower is better - 1 prefix = perfect)
        if total_imports > 0 and prefix_counts:
            # Find most common prefix
            max_count = max(prefix_counts.values())
            consistency_score = max_count / total_imports
            self.map["health"]["import_consistency_score"] = consistency_score

            # Store import prefixes for debugging
            self.map["health"]["import_prefixes"] = dict(prefix_counts)
        else:
            self.map["health"]["import_consistency_score"] = 1.0

    def _find_models(self):
        """Build model registry (canonical locations)"""
        for module_path, symbols in self.map["symbols"].items():
            for symbol in symbols:
                if symbol.get("is_model"):
                    model_name = symbol["name"]

                    # Use first found as canonical (or prefer backend.app.models)
                    if model_name not in self.map["models"]:
                        self.map["models"][model_name] = module_path
                    elif "models" in module_path and "backend" in module_path:
                        # Override if this is in proper models directory
                        self.map["models"][model_name] = module_path

    def _find_routes(self):
        """Find route handlers (Flask/FastAPI)"""
        for file_path, imports in self.map["imports"].items():
            # Check if file imports Flask route decorators
            has_flask = any(
                imp["module"] in ["flask", "flask.blueprints"]
                for imp in imports
            )

            if has_flask:
                self.map["routes"][file_path] = {
                    "type": "flask",
                    "models_used": []  # TODO: detect which models are imported
                }

    def save(self, output_path: Path):
        """Save project map to JSON"""
        with open(output_path, 'w') as f:
            json.dump(self.map, f, indent=2)
        print(f"💾 Saved project map to {output_path}")


def main():
    workspace = Path("/Users/JB/Documents/Synergies")
    output = workspace / "project_map.json"

    print("=" * 60)
    print("PROJECT MAP GENERATOR")
    print("=" * 60)

    generator = ProjectMapGenerator(workspace)
    project_map = generator.scan()
    generator.save(output)

    # Print warnings
    if project_map["health"]["duplicate_count"] > 0:
        print("\n⚠️  DUPLICATES FOUND:")
        for dup in project_map["duplicates"]:
            print(f"   - {dup['symbol']} in {len(dup['locations'])} places ({dup['severity']})")
            for loc in dup['locations']:
                print(f"     → {loc}")

    if project_map["health"]["import_consistency_score"] < 0.98:
        print(f"\n⚠️  IMPORT INCONSISTENCY: {project_map['health']['import_consistency_score']:.1%}")
        print("   Multiple import styles detected:")
        for prefix, count in project_map["health"].get("import_prefixes", {}).items():
            print(f"     - {prefix}: {count} imports")

    print("\n✅ Project map ready for V3 integration")
    print(f"   Use this at the start of each task to prevent architectural drift")


if __name__ == "__main__":
    main()
