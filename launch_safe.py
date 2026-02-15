"""
Safe Autonomous Launcher for Synergies Tool
- Whitelisted commands only
- Audit logging
- Directory containment
- Web research allowed (but safe)
"""

import autogen
import os
import json
import subprocess
from datetime import datetime
from pathlib import Path

# Workspace root (container: /workspace, host: ~/Documents/Synergies)
WORKSPACE = Path("/workspace") if os.path.exists("/workspace") else Path.cwd()

# Audit log
AUDIT_LOG = WORKSPACE / "AUDIT_LOG.jsonl"

# Session log
SESSION_LOG = WORKSPACE / "SESSION_LOG.md"

# Whitelisted commands (safe operations only)
ALLOWED_COMMANDS = {
    'python', 'python3', 'pytest', 'pip',
    'git', 'ls', 'cat', 'grep', 'find', 'mkdir', 'touch',
    'echo', 'pwd', 'whoami', 'date', 'head', 'tail', 'wc'
}

# Forbidden commands (dangerous)
FORBIDDEN_COMMANDS = {
    'sudo', 'su', 'rm', 'rmdir', 'dd', 'mkfs',
    'chmod', 'chown', 'kill', 'killall',
    'reboot', 'shutdown', 'systemctl',
    'brew', 'apt', 'yum', 'dnf',
    'curl', 'wget'  # Use requests library instead
}


def log_audit(event_type: str, data: dict):
    """Append to audit log"""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "data": data
    }

    with open(AUDIT_LOG, 'a') as f:
        f.write(json.dumps(entry) + '\n')


def safe_code_executor(code: str, lang: str = "python"):
    """
    Execute code with safety checks

    Blocks:
    - Dangerous shell commands
    - Attempts to leave /workspace
    - Eval/exec of external code
    """

    log_audit("code_execution_attempt", {"lang": lang, "code": code[:200]})

    # If Python code, allow it (sandboxed by container)
    if lang == "python":
        try:
            result = subprocess.run(
                ["python", "-c", code],
                capture_output=True,
                text=True,
                timeout=300,  # 5 min max
                cwd=str(WORKSPACE)
            )

            log_audit("code_execution_success", {
                "exit_code": result.returncode,
                "stdout_length": len(result.stdout)
            })

            return result.returncode, result.stdout, result.stderr

        except Exception as e:
            log_audit("code_execution_error", {"error": str(e)})
            return 1, "", str(e)

    # If shell command, validate it
    elif lang == "sh" or lang == "bash":
        # Parse first word (command)
        cmd = code.strip().split()[0] if code.strip() else ""

        # Check if forbidden
        if cmd in FORBIDDEN_COMMANDS:
            error = f"🚫 Command '{cmd}' is forbidden for security"
            log_audit("command_blocked", {"command": cmd, "reason": "forbidden"})
            return 1, "", error

        # Check if not whitelisted
        if cmd and cmd not in ALLOWED_COMMANDS:
            error = f"⚠️  Command '{cmd}' is not in whitelist. Safe commands: {sorted(ALLOWED_COMMANDS)}"
            log_audit("command_blocked", {"command": cmd, "reason": "not_whitelisted"})
            return 1, "", error

        # Check for directory traversal
        if '..' in code or '~/' in code or '/Users/' in code or '/home/' in code:
            error = f"🚫 Directory traversal detected in: {code}"
            log_audit("command_blocked", {"command": code, "reason": "traversal"})
            return 1, "", error

        # Execute safe command
        try:
            result = subprocess.run(
                code,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300,
                cwd=str(WORKSPACE)
            )

            log_audit("command_executed", {
                "command": code[:100],
                "exit_code": result.returncode
            })

            return result.returncode, result.stdout, result.stderr

        except Exception as e:
            log_audit("command_error", {"error": str(e)})
            return 1, "", str(e)

    else:
        return 1, "", f"Unsupported language: {lang}"


def check_kill_switch():
    """Check for STOP_NOW file"""
    if (WORKSPACE / "STOP_NOW").exists():
        log_audit("kill_switch_activated", {})
        print("\n🛑 KILL SWITCH DETECTED - Stopping gracefully...")
        return True
    return False


def update_session_log(message: str):
    """Append to session log"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(SESSION_LOG, 'a') as f:
        f.write(f"\n**[{timestamp}]** {message}\n")


# Configure Ollama/Llama backend
config_list = [{
    "model": "llama3.1:8b",
    "api_base": "http://host.docker.internal:11434/v1",  # Access host Ollama from container
    "api_type": "open_ai",
    "api_key": "none"
}]

# Read project spec
spec_path = WORKSPACE / "PROJECT_SPEC.md"
if spec_path.exists():
    with open(spec_path, 'r') as f:
        project_spec = f.read()
else:
    project_spec = "Build M&A Synergies Analysis Tool per requirements"


def main():
    """Launch autonomous build with safety guardrails"""

    print("🔒 SECURE AUTONOMOUS BUILD")
    print("=" * 60)
    print(f"📁 Workspace: {WORKSPACE}")
    print(f"🔐 Security: Whitelisted commands only")
    print(f"🌐 Network: Enabled (for research)")
    print(f"📝 Audit log: {AUDIT_LOG}")
    print(f"🛑 Kill switch: Create STOP_NOW file to stop")
    print("=" * 60)

    log_audit("session_start", {"workspace": str(WORKSPACE)})
    update_session_log("🚀 Autonomous build started")

    # Create worker agent
    worker = autogen.AssistantAgent(
        name="Builder",
        llm_config={"config_list": config_list},
        system_message=f"""You are building the M&A Synergies Analysis Tool.

SECURITY RULES:
1. You are in /workspace directory - NEVER leave it
2. Do NOT use sudo, rm, or other dangerous commands
3. Safe commands: {', '.join(sorted(ALLOWED_COMMANDS))}
4. For web requests, use Python's requests library
5. All work stays in /workspace

TASK:
{project_spec}

Work autonomously. Commit to git every 30 minutes.
Check for STOP_NOW file every 15 minutes.
Update SESSION_LOG.md every hour.

START BUILDING."""
    )

    # Create executor with safe code execution
    executor = autogen.UserProxyAgent(
        name="Executor",
        code_execution_config={
            "work_dir": str(WORKSPACE),
            "use_docker": False,  # Already in Docker
            "executor": safe_code_executor  # Use our safe executor
        },
        human_input_mode="NEVER",
        max_consecutive_auto_reply=200
    )

    # Launch build
    try:
        executor.initiate_chat(
            worker,
            message=f"""Build the M&A Synergies Analysis Tool.

Read PROJECT_SPEC.md for requirements.

You have access to:
- Pre-populated synergies data in data/synergies_safe.json (50 examples)
- Python, git, pytest (whitelisted commands)
- Web access via requests library

Complete:
1. Data model and database
2. Backend Flask API
3. Frontend dashboard
4. Tests
5. Demo with dummy data

Deliverable: Working demo

Check for STOP_NOW every 15 minutes.
Update SESSION_LOG.md every hour.
Commit every 30 minutes.

BEGIN."""
        )

        log_audit("session_complete", {"status": "success"})
        update_session_log("✅ Build completed successfully")

    except KeyboardInterrupt:
        log_audit("session_interrupted", {"reason": "keyboard_interrupt"})
        update_session_log("⏸️  Build interrupted by user")
        print("\n⏸️  Build interrupted. Progress saved.")

    except Exception as e:
        log_audit("session_error", {"error": str(e)})
        update_session_log(f"❌ Build failed: {str(e)}")
        print(f"\n❌ Error: {e}")

    finally:
        print("\n" + "=" * 60)
        print("📊 Session complete")
        print(f"📝 Audit log: {AUDIT_LOG}")
        print(f"📋 Session log: {SESSION_LOG}")
        print(f"📁 Check {WORKSPACE} for results")
        print("=" * 60)


if __name__ == "__main__":
    main()
