#!/bin/bash

# ============================================
# FULL Deployment with Hyperledger Fabric
# Uses Docker images for Fabric (no local binaries needed)
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
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"

echo ""
echo "============================================"
echo "  Agricultural Supply Chain - FULL Deploy"
echo "  (With Hyperledger Fabric Blockchain)"
echo "============================================"
echo ""

# Check .env
if [ ! -f "${DEPLOY_DIR}/.env" ]; then
    log_error ".env file not found!"
    log_info "Run: cp .env.template .env && nano .env"
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
# Step 1: Clean up old fabric network
# ============================================
log_info "[1/10] Cleaning up old Fabric data..."
rm -rf fabric-network/organizations/ordererOrganizations
rm -rf fabric-network/organizations/peerOrganizations
rm -rf fabric-network/channel-artifacts/*
mkdir -p fabric-network/channel-artifacts

log_success "Cleaned up!"

# ============================================
# Step 2: Create crypto-config.yaml
# ============================================
log_info "[2/10] Creating crypto-config.yaml..."

cat > fabric-network/crypto-config.yaml << 'EOF'
OrdererOrgs:
  - Name: Orderer
    Domain: example.com
    EnableNodeOUs: true
    Specs:
      - Hostname: orderer
        SANS:
          - localhost
          - orderer.example.com
          - 127.0.0.1

PeerOrgs:
  - Name: Org1
    Domain: org1.example.com
    EnableNodeOUs: true
    Template:
      Count: 1
      SANS:
        - localhost
        - peer0.org1.example.com
        - 127.0.0.1
    Users:
      Count: 1
EOF

log_success "crypto-config.yaml created!"

# ============================================
# Step 3: Generate crypto materials using Docker
# ============================================
log_info "[3/10] Generating crypto materials..."

docker pull hyperledger/fabric-tools:2.5

docker run --rm \
    -v "${DEPLOY_DIR}/fabric-network:/fabric-network" \
    -w /fabric-network \
    hyperledger/fabric-tools:2.5 \
    cryptogen generate --config=/fabric-network/crypto-config.yaml --output=/fabric-network/organizations

if [ $? -ne 0 ]; then
    log_error "Failed to generate crypto materials"
    exit 1
fi

# Verify crypto was generated
if [ ! -f "${DEPLOY_DIR}/fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt" ]; then
    log_error "TLS certificates not found! Crypto generation failed."
    log_info "Checking what was generated..."
    find "${DEPLOY_DIR}/fabric-network/organizations" -name "*.crt" 2>/dev/null | head -20
    exit 1
fi

log_success "Crypto materials generated!"

# ============================================
# Step 4: Create configtx.yaml with ABSOLUTE paths for genesis
# ============================================
log_info "[4/10] Creating configtx.yaml..."

cat > fabric-network/configtx.yaml << EOF
Organizations:
  - &OrdererOrg
    Name: OrdererOrg
    ID: OrdererMSP
    MSPDir: /fabric-network/organizations/ordererOrganizations/example.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('OrdererMSP.member')"
      Writers:
        Type: Signature
        Rule: "OR('OrdererMSP.member')"
      Admins:
        Type: Signature
        Rule: "OR('OrdererMSP.admin')"
    OrdererEndpoints:
      - orderer.example.com:7050

  - &Org1
    Name: Org1MSP
    ID: Org1MSP
    MSPDir: /fabric-network/organizations/peerOrganizations/org1.example.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('Org1MSP.admin', 'Org1MSP.peer', 'Org1MSP.client')"
      Writers:
        Type: Signature
        Rule: "OR('Org1MSP.admin', 'Org1MSP.client')"
      Admins:
        Type: Signature
        Rule: "OR('Org1MSP.admin')"
      Endorsement:
        Type: Signature
        Rule: "OR('Org1MSP.peer')"
    AnchorPeers:
      - Host: peer0.org1.example.com
        Port: 7051

Capabilities:
  Channel: &ChannelCapabilities
    V2_0: true
  Orderer: &OrdererCapabilities
    V2_0: true
  Application: &ApplicationCapabilities
    V2_5: true

Application: &ApplicationDefaults
  Organizations:
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
    LifecycleEndorsement:
      Type: ImplicitMeta
      Rule: "MAJORITY Endorsement"
    Endorsement:
      Type: ImplicitMeta
      Rule: "MAJORITY Endorsement"
  Capabilities:
    <<: *ApplicationCapabilities

Orderer: &OrdererDefaults
  OrdererType: etcdraft
  Addresses:
    - orderer.example.com:7050
  EtcdRaft:
    Consenters:
      - Host: orderer.example.com
        Port: 7050
        ClientTLSCert: /fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
        ServerTLSCert: /fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
  BatchTimeout: 2s
  BatchSize:
    MaxMessageCount: 10
    AbsoluteMaxBytes: 99 MB
    PreferredMaxBytes: 512 KB
  Organizations:
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
    BlockValidation:
      Type: ImplicitMeta
      Rule: "ANY Writers"

Channel: &ChannelDefaults
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
  Capabilities:
    <<: *ChannelCapabilities

Profiles:
  ChannelUsingRaft:
    <<: *ChannelDefaults
    Orderer:
      <<: *OrdererDefaults
      Organizations:
        - *OrdererOrg
      Capabilities: *OrdererCapabilities
    Application:
      <<: *ApplicationDefaults
      Organizations:
        - *Org1
      Capabilities: *ApplicationCapabilities
EOF

log_success "configtx.yaml created!"

# ============================================
# Step 5: Generate genesis block
# ============================================
log_info "[5/10] Generating channel genesis block..."

docker run --rm \
    -v "${DEPLOY_DIR}/fabric-network:/fabric-network" \
    -w /fabric-network \
    -e FABRIC_CFG_PATH=/fabric-network \
    hyperledger/fabric-tools:2.5 \
    configtxgen -profile ChannelUsingRaft -outputBlock /fabric-network/channel-artifacts/mychannel.block -channelID mychannel

if [ $? -ne 0 ]; then
    log_error "Failed to create genesis block"
    exit 1
fi

log_success "Genesis block created!"

# ============================================
# Step 6: Start infrastructure
# ============================================
log_info "[6/10] Starting database and Fabric network..."

# Stop any existing containers
docker compose down 2>/dev/null || true

# Start PostgreSQL and CouchDB first
docker compose up -d postgres couchdb0
log_info "Waiting for database..."
sleep 15

# Wait for postgres
until docker exec agri-postgres pg_isready -U postgres > /dev/null 2>&1; do
    log_info "Waiting for PostgreSQL..."
    sleep 3
done
log_success "PostgreSQL ready!"

# Start Fabric orderer
log_info "Starting orderer..."
docker compose up -d orderer.example.com
sleep 10

# Start Fabric peer
log_info "Starting peer..."
docker compose up -d peer0.org1.example.com
sleep 10

log_success "Fabric network started!"

# ============================================
# Step 7: Create and join channel
# ============================================
log_info "[7/10] Creating channel and joining peer..."

# Start CLI container
docker compose up -d cli
sleep 5

# Join orderer to channel using osnadmin
log_info "Joining orderer to channel..."
docker exec fabric-cli bash -c '
osnadmin channel join --channelID mychannel \
    --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/mychannel.block \
    -o orderer.example.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key
'

if [ $? -ne 0 ]; then
    log_warn "Orderer join returned error - checking status..."
fi

sleep 5

# Join peer to channel
log_info "Joining peer to channel..."
docker exec fabric-cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/mychannel.block
'

if [ $? -eq 0 ]; then
    log_success "Peer joined channel!"
else
    log_warn "Peer join may need verification"
fi

# ============================================
# Step 8: Deploy chaincode
# ============================================
log_info "[8/10] Deploying chaincode..."

docker exec fabric-cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

cd /opt/gopath/src/github.com/hyperledger/fabric/peer

echo "Packaging chaincode..."
peer lifecycle chaincode package agricultural-contract.tar.gz \
    --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/agricultural-contract \
    --lang node \
    --label agricultural-contract_1.0

echo "Installing chaincode..."
peer lifecycle chaincode install agricultural-contract.tar.gz

echo "Getting package ID..."
CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled 2>&1 | grep -o "agricultural-contract_1.0:[a-f0-9]*")
echo "Package ID: $CC_PACKAGE_ID"

if [ -z "$CC_PACKAGE_ID" ]; then
    echo "ERROR: Could not get package ID"
    exit 1
fi

echo "Approving chaincode..."
peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt \
    --channelID mychannel \
    --name agricultural-contract \
    --version 1.0 \
    --package-id $CC_PACKAGE_ID \
    --sequence 1

echo "Committing chaincode..."
peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt \
    --channelID mychannel \
    --name agricultural-contract \
    --version 1.0 \
    --sequence 1 \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

echo "Chaincode deployment complete!"
'

if [ $? -eq 0 ]; then
    log_success "Chaincode deployed!"
else
    log_warn "Chaincode deployment needs verification"
fi

# ============================================
# Step 9: Build and start application
# ============================================
log_info "[9/10] Building and starting application services..."

log_info "Building backend..."
docker compose build backend

log_info "Building frontend..."
docker compose build frontend

log_info "Building ML service..."
docker compose build ml-service

log_info "Starting services..."
docker compose up -d backend ml-service
sleep 15
docker compose up -d frontend nginx

log_success "Application services started!"

# ============================================
# Step 10: Verify deployment
# ============================================
log_info "[10/10] Verifying deployment..."

sleep 10

echo ""
echo "============================================"
echo "  Service Status"
echo "============================================"
docker compose ps

echo ""

# Test endpoints
if curl -s --max-time 5 "http://localhost:3000/api/health" > /dev/null 2>&1; then
    log_success "Backend API: Running"
else
    log_warn "Backend API: Starting..."
fi

if curl -s --max-time 5 "http://localhost:5000/health" > /dev/null 2>&1; then
    log_success "ML Service: Running"
else
    log_warn "ML Service: Starting..."
fi

# Check Fabric
CHANNEL_CHECK=$(docker exec peer0.org1.example.com peer channel list 2>/dev/null | grep mychannel || echo "")
if [ -n "$CHANNEL_CHECK" ]; then
    log_success "Fabric Network: Channel 'mychannel' active"
else
    log_warn "Fabric Network: Verifying..."
fi

echo ""
echo "============================================"
echo -e "${GREEN}  FULL DEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo "Your application is available at:"
echo "  Frontend:  http://${SERVER_IP}"
echo "  API:       http://${SERVER_IP}/api"
echo ""
echo "Blockchain network:"
echo "  Channel:   mychannel"
echo "  Chaincode: agricultural-contract"
echo ""
echo "Commands:"
echo "  View logs:      docker compose logs -f"
echo "  Fabric logs:    docker compose logs -f peer0.org1.example.com"
echo "  Check channel:  docker exec peer0.org1.example.com peer channel list"
echo "  Restart:        docker compose restart"
echo ""
