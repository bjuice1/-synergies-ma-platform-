# Secure Docker container for autonomous Synergies build
# - Isolated from host system
# - Can access web for research
# - Cannot leave /workspace directory
# - Cannot install system packages
# - Cannot run privileged operations

FROM python:3.11-slim

# Create non-root user for security
RUN useradd -m -u 1000 -s /bin/bash synergies && \
    mkdir -p /workspace && \
    chown -R synergies:synergies /workspace

# Set working directory
WORKDIR /workspace

# Copy requirements first (Docker layer caching)
COPY requirements.txt /workspace/

# Install Python dependencies as root (last time we need root)
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir pyautogen

# Switch to non-root user (can't sudo, can't install packages)
USER synergies

# Copy project files (will be overridden by volume mount)
COPY --chown=synergies:synergies . /workspace/

# Health check
HEALTHCHECK --interval=5m --timeout=3s \
  CMD python -c "import os; assert os.path.exists('/workspace')" || exit 1

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/workspace

# Default command
CMD ["/bin/bash"]
