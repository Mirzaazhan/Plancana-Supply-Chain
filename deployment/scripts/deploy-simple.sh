#!/bin/bash

# ============================================
# Simplified Deployment Script (No local Fabric binaries needed)
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "============================================"
echo "  Agricultural Supply Chain Deployment"
echo "  (Simplified - Docker Only)"
echo "============================================"
echo ""

# Check .env
if [ ! -f "${DEPLOY_DIR}/.env" ]; then
    log_error ".env file not found! Run: cp .env.template .env && nano .env"
    exit 1
fi

source "${DEPLOY_DIR}/.env"

if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "YOUR_UPCLOUD_SERVER_IP" ]; then
    log_error "Set SERVER_IP in .env file!"
    exit 1
fi

log_info "Deploying to: $SERVER_IP"
cd "${DEPLOY_DIR}"

# ============================================
# Step 1: Pull Docker Images
# ============================================
log_info "[1/6] Pulling Docker images..."
docker compose pull postgres || true

# ============================================
# Step 2: Start Database First
# ============================================
log_info "[2/6] Starting PostgreSQL..."
docker compose up -d postgres
log_info "Waiting for database to be ready..."
sleep 15

# Check if postgres is healthy
until docker exec agri-postgres pg_isready -U postgres > /dev/null 2>&1; do
    log_info "Waiting for PostgreSQL..."
    sleep 5
done
log_success "PostgreSQL is ready!"

# ============================================
# Step 3: Build Application Images
# ============================================
log_info "[3/6] Building backend image..."
docker compose build backend

log_info "Building frontend image..."
docker compose build frontend

log_info "Building ML service image..."
docker compose build ml-service

# ============================================
# Step 4: Start Backend (runs migrations)
# ============================================
log_info "[4/6] Starting backend..."
docker compose up -d backend
sleep 10

# ============================================
# Step 5: Start Remaining Services
# ============================================
log_info "[5/6] Starting frontend and ML service..."
docker compose up -d ml-service frontend

# ============================================
# Step 6: Start Nginx
# ============================================
log_info "[6/6] Starting nginx reverse proxy..."
docker compose up -d nginx

# Wait for services to stabilize
log_info "Waiting for services to start..."
sleep 15

# ============================================
# Verify
# ============================================
echo ""
echo "============================================"
echo "  Checking Services"
echo "============================================"
docker compose ps

echo ""

# Test endpoints
if curl -s --max-time 5 "http://localhost:3000/api/health" > /dev/null 2>&1; then
    log_success "Backend API: Running"
else
    log_warn "Backend API: Starting up..."
fi

if curl -s --max-time 5 "http://localhost:5000/health" > /dev/null 2>&1; then
    log_success "ML Service: Running"
else
    log_warn "ML Service: Starting up..."
fi

if curl -s --max-time 5 "http://localhost:3001" > /dev/null 2>&1; then
    log_success "Frontend: Running"
else
    log_warn "Frontend: Starting up..."
fi

echo ""
echo "============================================"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo "Access your application:"
echo "  Frontend:  http://${SERVER_IP}"
echo "  API:       http://${SERVER_IP}/api"
echo ""
echo "Commands:"
echo "  View logs:   docker compose logs -f"
echo "  Restart:     docker compose restart"
echo "  Stop:        docker compose down"
echo ""
echo -e "${YELLOW}NOTE: Blockchain features are disabled in this deployment.${NC}"
echo "The system will use database-only mode."
echo ""
