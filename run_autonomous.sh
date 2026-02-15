#!/bin/bash
# Run autonomous build in secure Docker container

set -e

echo "🚀 STARTING AUTONOMOUS BUILD"
echo "========================================"
echo "📁 Workspace: ~/Documents/Synergies"
echo "🔒 Security: Docker isolated, whitelisted commands"
echo "🌐 Network: Enabled (for research)"
echo "🛑 Kill switch: touch STOP_NOW to stop"
echo "========================================"
echo ""

# Check if Docker image exists
if ! docker image inspect synergies-safe &> /dev/null; then
    echo "❌ Docker image not found. Run ./setup_docker.sh first"
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "⚠️  Ollama not detected on localhost:11434"
    echo "Make sure Ollama is running: ollama serve"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Remove old STOP_NOW if exists
rm -f ~/Documents/Synergies/STOP_NOW

# Run Docker container
echo "🔨 Starting build..."
echo "Monitor progress in another terminal:"
echo "  tail -f ~/Documents/Synergies/SESSION_LOG.md"
echo "  tail -f ~/Documents/Synergies/AUDIT_LOG.jsonl"
echo ""

docker run --rm \
  -v ~/Documents/Synergies:/workspace \
  --add-host=host.docker.internal:host-gateway \
  --memory 4g \
  --cpus 2.0 \
  --pids-limit 100 \
  --security-opt no-new-privileges:true \
  --cap-drop ALL \
  --network bridge \
  synergies-safe \
  python /workspace/launch_safe.py

echo ""
echo "========================================"
echo "✅ BUILD COMPLETE"
echo ""
echo "Check results:"
echo "  cd ~/Documents/Synergies"
echo "  python backend/api.py  # Start API"
echo "  open frontend/index.html  # View dashboard"
echo ""
