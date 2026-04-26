#!/bin/bash

# Stop Genui Docker Stack
# This script stops the Genui application and PostgreSQL database

set -e

. "$(cd "$(dirname "$0")" && pwd)/_cloud-helpers.sh"

REPO_ROOT_DIR="$(get_repo_root)" || fail "Could not find repo root. Are you running from inside the genui folder?"
cd "$REPO_ROOT_DIR"

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    fail \
      "❌ docker.env file not found!" \
      "📝 Please copy docker.env.example to docker.env and update with your values"
fi

warn "🛑 Stopping Genui Docker Stack..."

# Stop all services
info "🎯 Stopping all services..."
docker compose --env-file docker.env down || true

# Remove network (only if no other containers are using it)
info "🔗 Cleaning up network..."
docker network rm genui_network 2>/dev/null || true

success \
  "✅ Genui Docker Stack stopped successfully!" \
  "💡 To start the stack again: ./scripts/cloud/genui-start.sh" 
