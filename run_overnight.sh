#!/bin/bash
# 3-hour overnight autonomous build

echo "🌙 STARTING 3-HOUR OVERNIGHT BUILD"
echo "========================================"
echo "⏰ Duration: 3 hours"
echo "📁 Workspace: ~/Documents/Synergies"
echo "🔒 Security: Docker isolated"
echo "🛑 Kill switch: touch STOP_NOW"
echo "========================================"
echo ""

# Remove old STOP_NOW
rm -f ~/Documents/Synergies/STOP_NOW

# Log start time
echo "🚀 Started at: $(date)" > ~/Documents/Synergies/OVERNIGHT_RUN.log
echo "" >> ~/Documents/Synergies/OVERNIGHT_RUN.log

# Run Docker container in background
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
  python /workspace/launch_safe.py \
  >> ~/Documents/Synergies/OVERNIGHT_RUN.log 2>&1 &

DOCKER_PID=$!

echo "🔨 Build running in background (PID: $DOCKER_PID)"
echo "PID: $DOCKER_PID" >> ~/Documents/Synergies/OVERNIGHT_RUN.log
echo ""
echo "Monitor progress:"
echo "  tail -f ~/Documents/Synergies/SESSION_LOG.md"
echo "  tail -f ~/Documents/Synergies/OVERNIGHT_RUN.log"
echo ""
echo "Stop if needed:"
echo "  touch ~/Documents/Synergies/STOP_NOW"
echo ""
echo "✅ Go to sleep! Check results in the morning."
echo ""

# Set up 3-hour timeout
(
  sleep 10800  # 3 hours
  if ps -p $DOCKER_PID > /dev/null 2>&1; then
    echo "⏰ 3-hour timeout reached - stopping gracefully" >> ~/Documents/Synergies/OVERNIGHT_RUN.log
    touch ~/Documents/Synergies/STOP_NOW
    sleep 60  # Give it 1 min to stop gracefully
    if ps -p $DOCKER_PID > /dev/null 2>&1; then
      kill $DOCKER_PID 2>/dev/null
    fi
  fi
) &

echo "🌙 Overnight build started. Sleep well!"
