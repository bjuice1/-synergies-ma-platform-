#!/bin/bash
# Setup script for secure Docker environment

set -e  # Exit on error

echo "🔒 SETTING UP SECURE DOCKER ENVIRONMENT"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed"
    echo "Install from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "⚠️  Docker not running"
    echo "Starting Docker Desktop..."
    open -a Docker
    echo "Waiting for Docker to start (30 seconds)..."
    sleep 30
fi

# Verify Docker is ready
if ! docker info &> /dev/null; then
    echo "❌ Docker failed to start. Please start Docker Desktop manually."
    exit 1
fi

echo "✅ Docker is running"

# Build Docker image
echo ""
echo "📦 Building secure Docker image..."
cd ~/Documents/Synergies
docker build -t synergies-safe . || {
    echo "❌ Docker build failed"
    exit 1
}

echo "✅ Docker image built: synergies-safe"

# Test container
echo ""
echo "🧪 Testing container security..."
docker run --rm synergies-safe whoami | grep -q "synergies" && echo "✅ Running as non-root user" || echo "⚠️  Root user detected"

docker run --rm -v ~/Documents/Synergies:/workspace synergies-safe ls /workspace | grep -q "README.md" && echo "✅ Workspace mounted correctly" || echo "⚠️  Workspace mount failed"

# Create test STOP_NOW file
echo ""
echo "🛑 Testing kill switch..."
touch ~/Documents/Synergies/STOP_NOW_TEST
docker run --rm -v ~/Documents/Synergies:/workspace synergies-safe test -f /workspace/STOP_NOW_TEST && echo "✅ Kill switch file accessible" || echo "⚠️  Kill switch not accessible"
rm ~/Documents/Synergies/STOP_NOW_TEST

echo ""
echo "========================================"
echo "✅ SETUP COMPLETE"
echo ""
echo "Ready to run autonomous build on Saturday!"
echo ""
echo "To start build:"
echo "  ./run_autonomous.sh"
echo ""
echo "To stop build:"
echo "  touch STOP_NOW"
echo ""
