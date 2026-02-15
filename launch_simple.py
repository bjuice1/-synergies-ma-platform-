"""
Simple overnight launcher - Direct Llama calls
No autogen needed for quick test
"""

import requests
import json
import subprocess
from pathlib import Path
from datetime import datetime

WORKSPACE = Path("/workspace") if Path("/workspace").exists() else Path.cwd()

def call_llama(prompt, system=""):
    """Call Ollama API directly"""
    try:
        response = requests.post(
            'http://host.docker.internal:11434/api/generate',
            json={
                "model": "llama3.1:8b",
                "prompt": f"{system}\n\n{prompt}",
                "stream": False
            },
            timeout=300
        )
        if response.status_code == 200:
            return response.json().get('response', '')
        else:
            return f"Error: {response.status_code}"
    except Exception as e:
        return f"Error calling Llama: {e}"

def log(message):
    """Log to session log"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(WORKSPACE / "SESSION_LOG.md", "a") as f:
        f.write(f"\n**[{timestamp}]** {message}\n")
    print(f"[{timestamp}] {message}")

def run_command(cmd):
    """Run safe command"""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True,
            timeout=60, cwd=str(WORKSPACE)
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

log("🚀 Starting overnight autonomous build (simple mode)")

# Read project spec
with open(WORKSPACE / "PROJECT_SPEC.md") as f:
    spec = f.read()

# Task 1: Complete data model
log("📊 Task 1: Building data model...")
prompt = f"""Complete the data model in backend/data_model.py.

Requirements from spec:
- Synergy class with all fields
- Function class
- Industry class
- Database schema creation

Write the complete Python code for data_model.py.
Make it production-ready."""

code = call_llama(prompt, "You are an expert Python developer. Write clean, production code.")
log(f"Generated {len(code)} chars of code")

# Write code
with open(WORKSPACE / "backend" / "data_model.py", "w") as f:
    # Extract code from response
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0]
    f.write(code)

log("✅ Task 1 complete - data model written")

# Task 2: Database implementation
log("📊 Task 2: Building database layer...")
prompt = """Complete backend/database.py.

Implement:
- create_tables() method
- insert_synergy() method
- get_synergies() with filters
- get_functions(), get_industries()

Use SQLite. Write complete code."""

code = call_llama(prompt, "Expert Python/SQLite developer.")
with open(WORKSPACE / "backend" / "database.py", "w") as f:
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0]
    f.write(code)

log("✅ Task 2 complete - database layer written")

# Task 3: Load safe synergies
log("📊 Task 3: Loading synergies data...")
success, out, err = run_command("python -c 'from backend.database import db; db.connect(); db.create_tables()'")
if success:
    log("✅ Database created")
else:
    log(f"⚠️  Database error: {err}")

# Task 4: Flask API
log("📊 Task 4: Building Flask API...")
prompt = """Complete backend/api.py.

Implement all endpoints:
- GET /api/health
- GET /api/synergies (with filters)
- GET /api/synergies/<id>
- GET /api/functions
- GET /api/industries

Write complete working code."""

code = call_llama(prompt, "Expert Flask API developer.")
with open(WORKSPACE / "backend" / "api.py", "w") as f:
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0]
    f.write(code)

log("✅ Task 4 complete - API written")

# Commit progress
log("📝 Committing progress...")
run_command("git add .")
run_command('git commit -m "Overnight build: data model, database, API (AI-generated)"')

log("✅ Overnight build complete - check code in the morning!")
log("📊 Files modified: backend/data_model.py, backend/database.py, backend/api.py")

print("\n" + "="*60)
print("✅ OVERNIGHT BUILD COMPLETE")
print("Check SESSION_LOG.md for details")
print("="*60)
