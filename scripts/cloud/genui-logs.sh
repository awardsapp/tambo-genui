#!/bin/bash

# View Genui Docker Stack Logs
# This script displays logs from the Genui application and PostgreSQL database

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

info "📋 Genui Docker Stack Logs"
warn "Press Ctrl+C to exit"
printf '\n'

# Function to show usage
show_usage() {
    warn "Usage: $0 [service_name]"
    warn "Available services:"
    warn "  • web - Genui Web application"
    warn "  • api - Genui API application"
    warn "  • postgres - PostgreSQL Database"
    warn ""
    warn "Examples:"
    warn "  $0           # Show all logs"
    warn "  $0 web       # Show only web logs"
    warn "  $0 api       # Show only api logs"
    warn "  $0 postgres  # Show only postgres logs"
}

# Check if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

# If service name provided, show logs for that service only
if [ -n "$1" ]; then
    SERVICE_NAME="$1"
    info "📋 Showing logs for: $SERVICE_NAME"
    docker compose --env-file docker.env logs -f "$SERVICE_NAME"
else
    # Show all logs
    info "📋 Showing all logs"
    docker compose --env-file docker.env logs -f
fi 
