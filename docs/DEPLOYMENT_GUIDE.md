# Guarded V3 Deployment Guide

**How to add invariant enforcement to ANY Python project**

---

## 🎯 Quick Start (5 Minutes)

### For a New Project
```bash
# 1. Copy the protection tools
cp -r /path/to/Synergies/scripts /path/to/your-project/

# 2. Copy the guarded launcher
cp /path/to/Synergies/launch_unlimited_v3_GUARDED.py /path/to/your-project/

# 3. Generate initial project map
cd /path/to/your-project
python3 scripts/project_map_generator.py

# 4. You're protected! Use guarded mode:
python3 launch_unlimited_v3_GUARDED.py
```

### For Synergies App (Existing Project)
**You already have it!** Just use:
```bash
python3 launch_unlimited_v3_GUARDED.py
```

---

## 📦 What to Copy

### Core Files (Required)
```
scripts/
├── project_map_generator.py   # World model tracker
├── import_validator.py         # Pre-flight checks
├── drift_detector.py           # Health monitoring
└── fix_import_hell.py          # Auto-remediation

launch_unlimited_v3_GUARDED.py  # Protected launcher
```

### Documentation (Optional but Recommended)
```
docs/
├── INVARIANT_ENFORCEMENT_GUIDE.md  # Full usage guide
└── DEPLOYMENT_GUIDE.md             # This file
```

---

## 🔧 Setup for Different Project Types

### Scenario 1: New Flask/FastAPI Project

**Directory structure:**
```
my-app/
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── routes/
│   └── services/
├── tests/
├── scripts/          ← Copy protection tools here
└── launch_unlimited_v3_GUARDED.py
```

**Setup:**
```bash
# 1. Copy tools
mkdir scripts
cp /path/to/Synergies/scripts/*.py scripts/

# 2. Copy launcher (you'll need the base V3 too)
cp /path/to/Synergies/launch_unlimited_v3.py .
cp /path/to/Synergies/launch_unlimited_v3_GUARDED.py .

# 3. Initialize
python3 scripts/project_map_generator.py

# 4. Check canonical root detected correctly
cat project_map.json | jq '.canonical_root'
# Should show: "app"
```

### Scenario 2: Existing Project with Imports Mess

**If you already have import issues:**
```bash
# 1. Copy tools
cp -r /path/to/Synergies/scripts .

# 2. Generate project map
python3 scripts/project_map_generator.py

# 3. Check current health
python3 scripts/drift_detector.py

# Output will show:
#   - Import consistency: X%
#   - Duplicate models: N
#   - Issues: ...

# 4. Fix imports BEFORE starting guarded builds
python3 scripts/fix_import_hell.py

# 5. Verify fix
python3 scripts/drift_detector.py

# 6. Now safe to use guarded mode
python3 launch_unlimited_v3_GUARDED.py
```

### Scenario 3: Multi-Service Project

**Structure:**
```
monorepo/
├── service-a/
│   ├── app/
│   └── tests/
├── service-b/
│   ├── app/
│   └── tests/
└── shared/
    └── scripts/     ← Put tools here
```

**Setup (per service):**
```bash
# Run tools from shared location
cd service-a
python3 ../shared/scripts/project_map_generator.py

# Or symlink
ln -s ../shared/scripts scripts
python3 scripts/project_map_generator.py
```

---

## ⚙️ Configuration

### Customize Canonical Root

If your project uses a different structure:

**Edit `scripts/project_map_generator.py`:**
```python
# Line ~45 - Update preferred root
def _find_package_roots(self):
    # ...
    if "src" in roots:
        self.map["canonical_root"] = "src/app"
    elif "backend" in roots:
        self.map["canonical_root"] = "backend/app"
    elif "myproject" in roots:  # ← Add your structure
        self.map["canonical_root"] = "myproject"
```

### Customize Drift Detection Interval

**Edit `launch_unlimited_v3_GUARDED.py`:**
```python
# Line ~9
DRIFT_CHECK_INTERVAL = 3  # Check every N tasks

# For more stable projects: 5
# For risky refactors: 2
# For new projects: 3 (default)
```

### Customize Import Consistency Threshold

**Edit `scripts/drift_detector.py`:**
```python
# Line ~17
self.IMPORT_CONSISTENCY_THRESHOLD = 0.95  # 95%

# For existing messy codebases: 0.70 (70%)
# For new clean projects: 0.98 (98%)
# For production apps: 0.95 (95%)
```

---

## 🚀 Usage Workflows

### Daily Development with Protection

```bash
# Morning: Check current health
python3 scripts/drift_detector.py

# Work on feature branch
git checkout -b feature/new-endpoint

# Use guarded V3 for autonomous work
python3 launch_unlimited_v3_GUARDED.py

# After build: Verify quality maintained
python3 scripts/drift_detector.py

# Commit if healthy
git add .
git commit -m "Add new endpoint with guarded V3"
```

### Team Usage

**Setup for team:**
```bash
# 1. Commit protection tools to repo
git add scripts/ launch_unlimited_v3_GUARDED.py
git commit -m "Add V3 protection system"
git push

# 2. Add to .gitignore
echo "project_map.json" >> .gitignore
echo "drift_history.json" >> .gitignore
echo "backup_*/" >> .gitignore

# 3. Document in README
```

**Team workflow:**
```bash
# Developer A starts feature
python3 scripts/project_map_generator.py  # Generate baseline
python3 launch_unlimited_v3_GUARDED.py    # Protected build

# Developer B reviews PR
python3 scripts/drift_detector.py         # Check drift in PR
# Reject if critical drift detected
```

### CI/CD Integration

**Add to GitHub Actions / GitLab CI:**
```yaml
# .github/workflows/drift-check.yml
name: Architecture Health Check

on: [pull_request]

jobs:
  drift-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'

      - name: Generate Project Map
        run: python3 scripts/project_map_generator.py

      - name: Run Drift Detection
        run: |
          python3 scripts/drift_detector.py
          if [ $? -ne 0 ]; then
            echo "❌ Critical architectural drift detected"
            exit 1
          fi

      - name: Check Import Consistency
        run: |
          CONSISTENCY=$(cat project_map.json | jq '.health.import_consistency_score')
          echo "Import consistency: $CONSISTENCY"
          if (( $(echo "$CONSISTENCY < 0.95" | bc -l) )); then
            echo "❌ Import consistency below 95%"
            exit 1
          fi
```

---

## 📊 Integration Patterns

### Pattern 1: "Guard Rails" (Recommended)

**When:** Ongoing development on stable codebase

**How:**
- Run guarded V3 for all autonomous work
- Manual code review for critical features
- Drift detection in CI/CD

**Benefits:**
- Prevents regressions
- Maintains quality automatically
- Catches issues in PR review

### Pattern 2: "Clean Slate"

**When:** New project or complete refactor

**How:**
```bash
# 1. Start with clean structure
mkdir -p backend/app/{models,routes,services}
touch backend/app/__init__.py

# 2. Generate baseline
python3 scripts/project_map_generator.py

# 3. Verify 100% consistency
python3 scripts/drift_detector.py
# Should show: "✅ All checks pass"

# 4. Use guarded V3 from start
python3 launch_unlimited_v3_GUARDED.py
```

**Benefits:**
- Never accumulate technical debt
- Import consistency stays 95%+
- Zero duplicates

### Pattern 3: "Rescue Mission"

**When:** Existing project with major issues

**How:**
```bash
# 1. Assess damage
python3 scripts/project_map_generator.py
python3 scripts/drift_detector.py
# See: "Import consistency: 30%, 50 duplicates"

# 2. Create baseline branch
git checkout -b baseline-before-fix
git commit -m "Baseline before import fix"

# 3. Fix import hell
python3 scripts/fix_import_hell.py  # Creates backup!

# 4. Verify improvement
python3 scripts/drift_detector.py
# Should improve significantly

# 5. Use guarded mode going forward
python3 launch_unlimited_v3_GUARDED.py
```

**Benefits:**
- Fixes existing problems
- Prevents future problems
- Documented improvement

---

## 🎯 Project-Specific Examples

### Example: Synergies App

**Current state:**
```
/Users/JB/Documents/Synergies/
├── backend/
│   └── app/          ← Canonical root
│       ├── models/
│       ├── api/
│       └── services/
├── tests/
└── scripts/          ← Already set up!
```

**Your workflow:**
```bash
# Already configured! Just use it:

# 1. Check health before starting
python3 scripts/drift_detector.py

# 2. Create feature PRD
cat > prd_new_feature.json <<EOF
{
  "project_name": "Synergies - Add Export Feature",
  "tasks": [
    {"id": 1, "title": "Add Excel export service", ...},
    {"id": 2, "title": "Add export routes", ...}
  ]
}
EOF

# 3. Point V3 to new PRD
cp prd_new_feature.json prd.json

# 4. Run guarded build
python3 launch_unlimited_v3_GUARDED.py

# 5. Verify no drift
python3 scripts/drift_detector.py

# 6. Commit if healthy
git add .
git commit -m "Add export feature (guarded build)"
```

### Example: New Microservice

**Setup:**
```bash
# 1. Create structure
mkdir -p my-service/{app/{models,routes,services},tests,scripts}

# 2. Copy tools
cp /path/to/Synergies/scripts/*.py my-service/scripts/
cp /path/to/Synergies/launch_unlimited_v3_GUARDED.py my-service/

# 3. Create initial app
cat > my-service/app/__init__.py <<EOF
"""My Service"""
from flask import Flask

def create_app():
    app = Flask(__name__)
    return app
EOF

# 4. Generate baseline
cd my-service
python3 scripts/project_map_generator.py

# 5. Check - should be perfect
python3 scripts/drift_detector.py
# Output: ✅ All checks pass

# 6. Now build with protection
python3 launch_unlimited_v3_GUARDED.py
```

### Example: Legacy Django Project

**Adapt for Django:**
```python
# Edit scripts/project_map_generator.py
# Line ~45

def _find_package_roots(self):
    # Look for Django project
    if (self.workspace / "manage.py").exists():
        # Find Django app directories
        for item in self.workspace.iterdir():
            if item.is_dir() and (item / "apps.py").exists():
                self.map["canonical_root"] = item.name
                return
```

---

## 🛠️ Troubleshooting

### Issue: "No package root found"

**Cause:** No `__init__.py` in top-level directories

**Fix:**
```bash
# Add __init__.py to your main package
touch backend/__init__.py
python3 scripts/project_map_generator.py
```

### Issue: "Import consistency: 0%"

**Cause:** Non-Python project or no local imports

**Fix:** This is normal for:
- Pure JavaScript/frontend projects
- Projects with only external imports

**Solution:** Skip import validation:
```python
# Edit launch_unlimited_v3_GUARDED.py
# Comment out import validation
# guarded_write_code_file = original_write_code_file
```

### Issue: "Drift detector always shows CRITICAL"

**Cause:** Existing technical debt

**Fix:**
```bash
# 1. Lower threshold temporarily
# Edit scripts/drift_detector.py
self.IMPORT_CONSISTENCY_THRESHOLD = 0.70  # Accept current state

# 2. Fix gradually
python3 scripts/fix_import_hell.py

# 3. Raise threshold as you improve
# 0.70 → 0.80 → 0.90 → 0.95
```

---

## 📋 Checklist: New Project Setup

```
□ Copy scripts/ directory
□ Copy launch_unlimited_v3_GUARDED.py
□ Copy base launch_unlimited_v3.py (if not present)
□ Run project_map_generator.py
□ Verify canonical root detected correctly
□ Run drift_detector.py (should be healthy)
□ Add to .gitignore: project_map.json, drift_history.json, backup_*/
□ Update README with guarded V3 usage
□ Configure DRIFT_CHECK_INTERVAL if needed
□ Configure IMPORT_CONSISTENCY_THRESHOLD if needed
□ Test with 1-2 simple tasks first
□ Add drift check to CI/CD (optional)
```

---

## 🎓 Best Practices

### ✅ DO

1. **Run drift detection before every multi-task build**
   ```bash
   python3 scripts/drift_detector.py && python3 launch_unlimited_v3_GUARDED.py
   ```

2. **Commit project_map.json changes**
   - Shows codebase evolution
   - Team can see growth

3. **Fix drift immediately when detected**
   - Don't continue building on bad foundation
   - Small fixes now prevent big rewrites later

4. **Use feature branches**
   - Test guarded V3 on branches first
   - Merge only if drift checks pass

5. **Lower thresholds for legacy projects**
   - Accept current state
   - Improve gradually

### ❌ DON'T

1. **Don't disable pre-flight validation**
   - It's your main protection
   - If it blocks, fix the code, don't remove the guard

2. **Don't ignore drift warnings**
   - "WARNING" becomes "CRITICAL" quickly
   - Address before it compounds

3. **Don't delete backup directories before verifying**
   - Keep backups until build succeeds
   - Restore if anything breaks

4. **Don't use unguarded V3 for large builds**
   - 1-2 tasks: either works
   - 5+ tasks: use guarded mode
   - 20+ tasks: MUST use guarded mode

5. **Don't commit drift_history.json**
   - It's local development metadata
   - Different per developer

---

## 🚀 Ready to Deploy?

**For Synergies app:** You're already set up! Just use it.

**For other projects:** Follow the Quick Start at the top.

**Questions?** Check the full guide: `docs/INVARIANT_ENFORCEMENT_GUIDE.md`

---

## 📞 Quick Reference

```bash
# Generate/update project map
python3 scripts/project_map_generator.py

# Check current health
python3 scripts/drift_detector.py

# Fix import issues
python3 scripts/fix_import_hell.py

# Run protected build
python3 launch_unlimited_v3_GUARDED.py

# Test protection (no API calls)
python3 test_guarded_system.py
```

**Your protection system is portable, proven, and ready to scale.** 🛡️
