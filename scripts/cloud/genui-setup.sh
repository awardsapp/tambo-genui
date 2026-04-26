#!/bin/bash

# Setup Genui Docker Environment
# This script helps set up the Genui Docker environment for the first time

set -e

. "$(cd "$(dirname "$0")" && pwd)/_cloud-helpers.sh"

REPO_ROOT_DIR="$(get_repo_root)" || fail "Could not find repo root. Are you running from inside the genui folder?"
cd "$REPO_ROOT_DIR"

info "🚀 Genui Docker Setup"
info "This script will help you set up Genui for self-hosting with Docker"
info "📁 Working directory: $(pwd)"
printf '\n'

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    fail \
      "❌ Docker is not installed. Please install Docker first." \
      "💡 Visit: https://docs.docker.com/get-docker/"
fi

# Check if Docker Compose is installed (robust)
if ! docker compose version >/dev/null 2>&1 && ! docker-compose version >/dev/null 2>&1; then
    fail \
      "❌ Docker Compose is not installed. Please install Docker Compose first." \
      "💡 Visit: https://docs.docker.com/compose/install/"
fi

info "✅ Prerequisites check passed!"
printf '\n'

# Create docker.env from example if it doesn't exist
if [ ! -f "docker.env" ]; then
    warn "📝 Creating docker.env from example..."
    if [ -f "docker.env.example" ]; then
        cp docker.env.example docker.env
        info "✅ docker.env created successfully!"
    else
        fail "❌ docker.env.example not found!"
    fi
else
    info "ℹ️ docker.env already exists"
fi

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. ${YELLOW}Edit docker.env${NC} with your actual values:"
echo -e "   - Update passwords and secrets"
echo -e "   - Add your API keys (OpenAI, etc.)"
echo -e "   - Configure other settings as needed"
echo -e ""
echo -e "2. ${YELLOW}Build the containers:${NC}"
echo -e "   ./scripts/cloud/genui-build.sh"
echo -e ""
echo -e "3. ${YELLOW}Start the stack:${NC}"
echo -e "   ./scripts/cloud/genui-start.sh"
echo -e ""
echo -e "4. ${YELLOW}Initialize the database:${NC}"
echo -e "   ./scripts/cloud/init-database.sh"
echo -e ""
echo -e "5. ${YELLOW}Access your applications:${NC}"
echo -e "   - Genui Web: http://localhost:8260"
echo -e "   - Genui API: http://localhost:8261"
echo -e "   - PostgreSQL Database: localhost:5433"
echo -e ""
echo -e "${YELLOW}💡 Note: This script requires bash (macOS/Linux/WSL). Windows CMD or PowerShell will not work.${NC}"
echo -e "${YELLOW}💡 For help, run: ./scripts/cloud/genui-logs.sh --help${NC}"
