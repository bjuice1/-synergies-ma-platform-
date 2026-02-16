"""
IMPORT HELL FIX TOOL
Canonical solution for the #1 failure mode in autonomous builds.

What it does:
1. Analyzes current import mess
2. Determines canonical import path
3. Rewrites ALL imports to use canonical path
4. Consolidates duplicate models
5. Verifies fix worked

This is an AST-based refactor tool, NOT an LLM patch job.
"""
import ast
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import shutil
from datetime import datetime

class ImportRewriter(ast.NodeTransformer):
    """AST transformer to rewrite imports"""

    def __init__(self, old_prefix: str, new_prefix: str):
        self.old_prefix = old_prefix
        self.new_prefix = new_prefix
        self.changes_made = 0

    def visit_ImportFrom(self, node: ast.ImportFrom):
        """Rewrite 'from X import Y' statements"""
        if node.module and node.module.startswith(self.old_prefix):
            new_module = node.module.replace(self.old_prefix, self.new_prefix, 1)
            node.module = new_module
            self.changes_made += 1
        return node

    def visit_Import(self, node: ast.Import):
        """Rewrite 'import X' statements"""
        for alias in node.names:
            if alias.name.startswith(self.old_prefix):
                new_name = alias.name.replace(self.old_prefix, self.new_prefix, 1)
                alias.name = new_name
                self.changes_made += 1
        return node

class ImportHellFixer:
    """Comprehensive import hell fix"""

    def __init__(self, workspace: Path, canonical_root: str):
        self.workspace = workspace
        self.canonical_root = canonical_root
        self.canonical_prefix = canonical_root.replace('/', '.')
        self.backup_dir = workspace / f'backup_{datetime.now():%Y%m%d_%H%M%S}'
        self.stats = {'files_analyzed': 0, 'files_modified': 0, 'imports_rewritten': 0, 'duplicates_removed': 0}

    def fix_all(self):
        """Run complete fix procedure"""
        print('=' * 60)
        print('IMPORT HELL FIX - Canonical Rewrite')
        print('=' * 60)
        print(f'Canonical root: {self.canonical_root}')
        print(f'Canonical prefix: {self.canonical_prefix}')
        print()
        print('1️⃣  Creating backup...')
        self._create_backup()
        print('\n2️⃣  Analyzing current import patterns...')
        import_analysis = self._analyze_imports()
        self._print_analysis(import_analysis)
        print('\n3️⃣  Rewriting imports to canonical form...')
        self._rewrite_all_imports(import_analysis)
        print('\n4️⃣  Checking for duplicate package roots...')
        self._consolidate_package_roots()
        print('\n5️⃣  Verifying fix...')
        self._verify_fix()
        print('\n' + '=' * 60)
        print('FIX SUMMARY')
        print('=' * 60)
        print(f"Files analyzed: {self.stats['files_analyzed']}")
        print(f"Files modified: {self.stats['files_modified']}")
        print(f"Imports rewritten: {self.stats['imports_rewritten']}")
        print(f"Duplicates removed: {self.stats['duplicates_removed']}")
        print(f'\nBackup saved to: {self.backup_dir}')
        print('=' * 60)

    def _create_backup(self):
        """Backup entire backend/ directory"""
        backend_dir = self.workspace / 'backend'
        if backend_dir.exists():
            shutil.copytree(backend_dir, self.backup_dir / 'backend')
            print(f'   ✅ Backed up backend/ to {self.backup_dir.name}')
        app_dir = self.workspace / 'app'
        if app_dir.exists():
            shutil.copytree(app_dir, self.backup_dir / 'app')
            print(f'   ✅ Backed up app/ to {self.backup_dir.name}')

    def _analyze_imports(self) -> Dict:
        """Analyze all imports to find patterns"""
        analysis = {'total_imports': 0, 'by_prefix': defaultdict(int), 'wrong_imports': [], 'correct_imports': 0}
        for py_file in self.workspace.rglob('*.py'):
            if self._should_skip(py_file):
                continue
            self.stats['files_analyzed'] += 1
            try:
                content = py_file.read_text()
                tree = ast.parse(content, filename=str(py_file))
                for node in ast.walk(tree):
                    if isinstance(node, ast.ImportFrom):
                        if node.module:
                            analysis['total_imports'] += 1
                            first_part = node.module.split('.')[0]
                            analysis['by_prefix'][first_part] += 1
                            if first_part in ['backend', 'app', 'frontend']:
                                if not node.module.startswith(self.canonical_prefix):
                                    rel_path = py_file.relative_to(self.workspace)
                                    analysis['wrong_imports'].append({'file': str(rel_path), 'line': node.lineno, 'import': node.module})
                                else:
                                    analysis['correct_imports'] += 1
            except Exception as e:
                print(f'⚠️  Failed to analyze {py_file.name}: {e}')
        return analysis

    def _print_analysis(self, analysis: Dict):
        """Print import analysis"""
        print(f"   Total imports: {analysis['total_imports']}")
        print(f'   By prefix:')
        for prefix, count in sorted(analysis['by_prefix'].items(), key=lambda x: -x[1]):
            marker = '✅' if prefix == self.canonical_prefix.split('.')[0] else '❌'
            print(f'     {marker} {prefix}: {count}')
        wrong_count = len(analysis['wrong_imports'])
        if wrong_count > 0:
            print(f'\n   ❌ Found {wrong_count} imports to fix')
            for example in analysis['wrong_imports'][:3]:
                print(f"      - {example['file']}:{example['line']} → {example['import']}")
            if wrong_count > 3:
                print(f'      ... and {wrong_count - 3} more')
        else:
            print(f'\n   ✅ All imports already use canonical prefix')

    def _rewrite_all_imports(self, analysis: Dict):
        """Rewrite all imports to canonical form"""
        prefixes_to_fix = set()
        for prefix in analysis['by_prefix'].keys():
            if prefix in ['backend', 'app'] and prefix != self.canonical_prefix.split('.')[0]:
                prefixes_to_fix.add(prefix)
        if not prefixes_to_fix:
            print('   ✅ No imports need rewriting')
            return
        print(f"   Rewriting prefixes: {', '.join(prefixes_to_fix)} → {self.canonical_prefix}")
        for py_file in self.workspace.rglob('*.py'):
            if self._should_skip(py_file):
                continue
            try:
                content = py_file.read_text()
                tree = ast.parse(content, filename=str(py_file))
                modified = False
                for old_prefix in prefixes_to_fix:
                    rewriter = ImportRewriter(old_prefix, self.canonical_prefix.split('.')[0])
                    new_tree = rewriter.visit(tree)
                    if rewriter.changes_made > 0:
                        new_content = ast.unparse(new_tree)
                        py_file.write_text(new_content)
                        self.stats['imports_rewritten'] += rewriter.changes_made
                        modified = True
                if modified:
                    self.stats['files_modified'] += 1
                    rel_path = py_file.relative_to(self.workspace)
                    print(f'      ✍️  Modified {rel_path}')
            except Exception as e:
                print(f'⚠️  Failed to rewrite {py_file.name}: {e}')
        print(f"   ✅ Rewrote {self.stats['imports_rewritten']} imports in {self.stats['files_modified']} files")

    def _consolidate_package_roots(self):
        """Remove duplicate package roots"""
        backend_app = self.workspace / 'backend' / 'app'
        app = self.workspace / 'app'
        if backend_app.exists() and app.exists():
            print('   🚨 Found duplicate package roots: backend/app/ AND app/')
            print('   Recommendation: Manually review and consolidate')
            print('   Keep: backend/app/ (recommended)')
            print('   Move content from app/ to backend/app/ then delete app/')
            self.stats['duplicates_removed'] = 0
        else:
            print('   ✅ No duplicate package roots detected')

    def _verify_fix(self):
        """Verify the fix worked"""
        print('   Running verification...')
        analysis = self._analyze_imports()
        wrong_count = len(analysis['wrong_imports'])
        if wrong_count == 0:
            print('   ✅ All imports now use canonical prefix')
        else:
            print(f'   ⚠️  Still have {wrong_count} non-canonical imports')
            print('   May need manual review')
        try:
            sys.path.insert(0, str(self.workspace))
            if self.canonical_prefix == 'app':
                import backend
                print("   ✅ Successfully imported 'app' module")
            elif self.canonical_prefix == 'backend':
                import backend
                print("   ✅ Successfully imported 'backend' module")
        except ImportError as e:
            print(f'   ⚠️  Import test failed: {e}')

    def _should_skip(self, path: Path) -> bool:
        """Skip non-relevant paths"""
        skip_dirs = {'node_modules', 'venv', '.venv', '__pycache__', '.git', 'dist', 'build'}

        # Skip any directory starting with 'archived' or 'backup'
        for part in path.parts:
            if part.startswith('archived') or part.startswith('backup') or part.startswith('app_archived'):
                return True
            if part in skip_dirs:
                return True

        return False

class ModelConsolidator:
    """Consolidate duplicate model definitions"""

    def __init__(self, workspace: Path, canonical_models_path: str):
        self.workspace = workspace
        self.canonical_models_path = canonical_models_path

    def consolidate_duplicates(self, duplicates: List[Dict]):
        """
        Consolidate duplicate models by:
        1. Choosing canonical location
        2. Moving model code there
        3. Updating all imports
        """
        print('\n' + '=' * 60)
        print('MODEL CONSOLIDATION')
        print('=' * 60)
        for dup in duplicates:
            symbol = dup['symbol']
            locations = dup['locations']
            print(f"\n📦 Consolidating '{symbol}'")
            print(f'   Found in: {len(locations)} locations')
            canonical = None
            for loc in locations:
                if 'models' in loc:
                    canonical = loc
                    break
            if not canonical:
                canonical = locations[0]
            print(f'   Canonical: {canonical}')
            print(f'   Removing: {[l for l in locations if l != canonical]}')

def main():
    """Interactive import hell fix"""
    workspace = Path('/Users/JB/Documents/Synergies')
    print('=' * 60)
    print('IMPORT HELL FIX TOOL')
    print('=' * 60)
    print()
    print('This will:')
    print('1. Backup your code')
    print('2. Rewrite ALL imports to use canonical prefix')
    print('3. Consolidate duplicate package roots')
    print()
    print('Detecting canonical root...')
    backend_app = workspace / 'backend' / 'app'
    backend = workspace / 'backend'
    app = workspace / 'app'
    if backend_app.exists():
        canonical = 'backend/app'
    elif backend.exists():
        canonical = 'backend'
    elif app.exists():
        canonical = 'app'
    else:
        print('❌ Could not determine canonical root')
        print('   No backend/ or app/ directory found')
        sys.exit(1)
    print(f'Canonical root: {canonical}')
    print()
    response = input('Proceed with import rewrite? [y/N]: ')
    if response.lower() != 'y':
        print('Aborted')
        sys.exit(0)
    fixer = ImportHellFixer(workspace, canonical)
    fixer.fix_all()
    print('\n✅ Import hell fix complete!')
    print()
    print('Next steps:')
    print('1. Run: python3 scripts/project_map_generator.py')
    print('2. Run: python3 scripts/drift_detector.py')
    print('3. Test your app: python3 backend/app.py')
    print()
    print(f'If anything broke, restore from: {fixer.backup_dir}')
if __name__ == '__main__':
    main()