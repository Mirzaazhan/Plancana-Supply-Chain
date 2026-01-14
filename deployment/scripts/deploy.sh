#!/bin/bash

# ============================================
# Agricultural Supply Chain - Full Deployment Script
# For UpCloud Ubuntu 22.04 Server
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"

echo ""
echo "============================================"
echo "  Agricultural Supply Chain Deployment"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f "${DEPLOY_DIR}/.env" ]; then
    log_error ".env file not found!"
    log_info "Please copy .env.template to .env and fill in your values:"
    log_info "  cp ${DEPLOY_DIR}/.env.template ${DEPLOY_DIR}/.env"
    log_info "  nano ${DEPLOY_DIR}/.env"
    exit 1
fi

# Load environment variables
source "${DEPLOY_DIR}/.env"

# Check SERVER_IP is set
if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "YOUR_UPCLOUD_SERVER_IP" ]; then
    log_error "SERVER_IP is not set in .env file!"
    exit 1
fi

log_info "Deploying to server: $SERVER_IP"

# ============================================
# Step 1: System Updates and Docker Installation
# ============================================
install_docker() {
    log_info "Checking Docker installation..."

    if command -v docker &> /dev/null; then
        log_success "Docker is already installed: $(docker --version)"
    else
        log_info "Installing Docker..."

        # Update system
        sudo apt-get update
        sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

        # Add Docker GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Install Docker
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

        # Add current user to docker group
        sudo usermod -aG docker $USER

        log_success "Docker installed successfully!"
    fi

    # Ensure Docker is running
    sudo systemctl start docker
    sudo systemctl enable docker
}

# ============================================
# Step 2: Install Fabric Tools
# ============================================
install_fabric_tools() {
    log_info "Installing Hyperledger Fabric tools..."

    FABRIC_VERSION="2.5.4"
    CA_VERSION="1.5.7"

    if [ ! -d "/usr/local/fabric" ]; then
        # Download Fabric binaries
        curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary

        # Move binaries to system path
        sudo mkdir -p /usr/local/fabric
        sudo mv bin /usr/local/fabric/
        sudo mv config /usr/local/fabric/

        # Add to PATH
        echo 'export PATH=$PATH:/usr/local/fabric/bin' | sudo tee /etc/profile.d/fabric.sh
        source /etc/profile.d/fabric.sh

        log_success "Fabric tools installed!"
    else
        log_success "Fabric tools already installed"
    fi
}

# ============================================
# Step 3: Generate Fabric Crypto Material
# ============================================
generate_crypto() {
    log_info "Generating Fabric crypto material..."

    cd "${DEPLOY_DIR}/fabric-network"

    # Check if crypto material already exists
    if [ -d "organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/signcerts" ]; then
        log_warn "Crypto material already exists. Skipping generation."
        return
    fi

    # Use cryptogen to generate crypto material
    if command -v cryptogen &> /dev/null; then
        cryptogen generate --config=./crypto-config.yaml --output="organizations"
        log_success "Crypto material generated!"
    else
        log_warn "cryptogen not found. Will generate via CA containers..."
        # Crypto will be generated when CA containers start
    fi

    cd "${DEPLOY_DIR}"
}

# ============================================
# Step 4: Start Infrastructure Services
# ============================================
start_infrastructure() {
    log_info "Starting infrastructure services (DB, Fabric network)..."

    cd "${DEPLOY_DIR}"

    # Pull images first
    docker compose pull postgres couchdb0 ca.org1.example.com orderer.example.com peer0.org1.example.com

    # Start infrastructure
    docker compose up -d postgres couchdb0

    log_info "Waiting for PostgreSQL to be ready..."
    sleep 10

    # Start Fabric CA first
    docker compose up -d ca.org1.example.com
    sleep 5

    # Start Orderer and Peer
    docker compose up -d orderer.example.com peer0.org1.example.com
    sleep 10

    log_success "Infrastructure services started!"
}

# ============================================
# Step 5: Setup Fabric Channel and Chaincode
# ============================================
setup_fabric_channel() {
    log_info "Setting up Fabric channel..."

    cd "${DEPLOY_DIR}"

    # Start CLI container
    docker compose up -d cli
    sleep 5

    # Create channel (if not exists)
    docker exec fabric-cli bash -c "
        if ! peer channel list | grep -q mychannel; then
            cd /opt/gopath/src/github.com/hyperledger/fabric/peer

            # Generate genesis block
            configtxgen -profile TwoOrgsApplicationGenesis -outputBlock ./channel-artifacts/mychannel.block -channelID mychannel -configPath /opt/gopath/src/github.com/hyperledger/fabric/peer || true

            # Join channel
            peer channel join -b ./channel-artifacts/mychannel.block || true

            echo 'Channel setup complete!'
        else
            echo 'Channel already exists'
        fi
    " || log_warn "Channel setup may require manual intervention"

    log_success "Fabric channel setup initiated!"
}

# ============================================
# Step 6: Deploy Chaincode
# ============================================
deploy_chaincode() {
    log_info "Deploying chaincode..."

    docker exec fabric-cli bash -c "
        cd /opt/gopath/src/github.com/hyperledger/fabric/peer

        # Check if chaincode is already installed
        if peer lifecycle chaincode queryinstalled | grep -q 'agricultural-contract'; then
            echo 'Chaincode already installed'
        else
            # Package chaincode
            peer lifecycle chaincode package agricultural-contract.tar.gz \
                --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/agricultural-contract \
                --lang node \
                --label agricultural-contract_1.0

            # Install chaincode
            peer lifecycle chaincode install agricultural-contract.tar.gz

            echo 'Chaincode packaged and installed!'
        fi
    " || log_warn "Chaincode deployment may need manual steps"

    log_success "Chaincode deployment initiated!"
}

# ============================================
# Step 7: Start Application Services
# ============================================
start_application() {
    log_info "Building and starting application services..."

    cd "${DEPLOY_DIR}"

    # Build images
    log_info "Building backend..."
    docker compose build backend

    log_info "Building frontend..."
    docker compose build frontend

    log_info "Building ML service..."
    docker compose build ml-service

    # Start services
    docker compose up -d backend ml-service frontend nginx

    log_success "Application services started!"
}

# ============================================
# Step 8: Run Database Migrations
# ============================================
run_migrations() {
    log_info "Running database migrations..."

    sleep 10  # Wait for backend to be ready

    docker exec agri-backend npx prisma migrate deploy || log_warn "Migrations may need manual run"

    log_success "Database migrations complete!"
}

# ============================================
# Step 9: Verify Deployment
# ============================================
verify_deployment() {
    log_info "Verifying deployment..."

    echo ""
    echo "============================================"
    echo "  Checking Service Status"
    echo "============================================"

    docker compose ps

    echo ""
    log_info "Testing endpoints..."

    # Test backend health
    if curl -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
        log_success "Backend API is running"
    else
        log_warn "Backend API may still be starting..."
    fi

    # Test frontend
    if curl -s "http://localhost:3001" > /dev/null 2>&1; then
        log_success "Frontend is running"
    else
        log_warn "Frontend may still be starting..."
    fi

    # Test ML service
    if curl -s "http://localhost:5000/health" > /dev/null 2>&1; then
        log_success "ML Service is running"
    else
        log_warn "ML Service may still be starting..."
    fi

    echo ""
    echo "============================================"
    echo "  DEPLOYMENT COMPLETE!"
    echo "============================================"
    echo ""
    echo "Your application is available at:"
    echo ""
    echo "  Frontend:  http://${SERVER_IP}"
    echo "  API:       http://${SERVER_IP}/api"
    echo "  ML API:    http://${SERVER_IP}:5000"
    echo ""
    echo "Useful commands:"
    echo "  View logs:     docker compose logs -f"
    echo "  Stop all:      docker compose down"
    echo "  Restart:       docker compose restart"
    echo ""
}

# ============================================
# Main Execution
# ============================================
main() {
    install_docker

    # Need to relogin for docker group, or use sudo
    if ! groups | grep -q docker; then
        log_warn "Please logout and login again for docker group, then re-run this script"
        log_info "Or run: newgrp docker && ./deploy.sh"
        exit 0
    fi

    install_fabric_tools
    generate_crypto
    start_infrastructure
    setup_fabric_channel
    deploy_chaincode
    start_application
    run_migrations
    verify_deployment
}

# Run main function
main "$@"
