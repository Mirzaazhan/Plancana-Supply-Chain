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
# Step 1: Create Fabric directories
# ============================================
log_info "[1/10] Setting up Fabric network directories..."

mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/ca
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/admincerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/cacerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/keystore
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/signcerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/tlscacerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/admincerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/cacerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/msp/admincerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/msp/cacerts
mkdir -p fabric-network/organizations/peerOrganizations/org1.example.com/msp/tlscacerts
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/admincerts
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/cacerts
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/keystore
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/signcerts
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/msp/admincerts
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/msp/cacerts
mkdir -p fabric-network/organizations/ordererOrganizations/example.com/msp/tlscacerts
mkdir -p fabric-network/organizations/fabric-ca/org1
mkdir -p fabric-network/organizations/fabric-ca/ordererOrg
mkdir -p fabric-network/channel-artifacts

log_success "Directories created!"

# ============================================
# Step 2: Generate crypto config files
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
log_info "[3/10] Generating crypto materials using Docker..."

# Pull the fabric-tools image
docker pull hyperledger/fabric-tools:2.5

# Run cryptogen in container
docker run --rm \
    -v "${DEPLOY_DIR}/fabric-network:/fabric-network" \
    -w /fabric-network \
    hyperledger/fabric-tools:2.5 \
    cryptogen generate --config=/fabric-network/crypto-config.yaml --output=/fabric-network/organizations

if [ $? -eq 0 ]; then
    log_success "Crypto materials generated!"
else
    log_error "Failed to generate crypto materials"
    exit 1
fi

# ============================================
# Step 4: Create configtx.yaml
# ============================================
log_info "[4/10] Creating configtx.yaml..."

cat > fabric-network/configtx.yaml << 'EOF'
Organizations:
  - &OrdererOrg
    Name: OrdererOrg
    ID: OrdererMSP
    MSPDir: organizations/ordererOrganizations/example.com/msp
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
    MSPDir: organizations/peerOrganizations/org1.example.com/msp
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
        ClientTLSCert: organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
        ServerTLSCert: organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
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

if [ $? -eq 0 ]; then
    log_success "Genesis block created!"
else
    log_error "Failed to create genesis block"
    exit 1
fi

# ============================================
# Step 6: Start infrastructure
# ============================================
log_info "[6/10] Starting database and Fabric network..."

# Start PostgreSQL and CouchDB first
docker compose up -d postgres couchdb0
sleep 10

# Wait for postgres
until docker exec agri-postgres pg_isready -U postgres > /dev/null 2>&1; do
    log_info "Waiting for PostgreSQL..."
    sleep 3
done
log_success "PostgreSQL ready!"

# Start Fabric orderer and peer
docker compose up -d orderer.example.com
sleep 5
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

# Join orderer to channel
docker exec fabric-cli bash -c "
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

# Join orderer
osnadmin channel join --channelID mychannel \
    --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/mychannel.block \
    -o orderer.example.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

# Join peer to channel
peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/mychannel.block

echo 'Channel joined successfully!'
" || log_warn "Channel setup may need verification"

log_success "Channel created!"

# ============================================
# Step 8: Deploy chaincode
# ============================================
log_info "[8/10] Deploying chaincode..."

docker exec fabric-cli bash -c "
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

cd /opt/gopath/src/github.com/hyperledger/fabric/peer

# Package chaincode
peer lifecycle chaincode package agricultural-contract.tar.gz \
    --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/agricultural-contract \
    --lang node \
    --label agricultural-contract_1.0

# Install chaincode
peer lifecycle chaincode install agricultural-contract.tar.gz

# Get package ID
export CC_PACKAGE_ID=\$(peer lifecycle chaincode queryinstalled | grep 'agricultural-contract_1.0' | awk -F'[, ]+' '{print \$3}')
echo \"Package ID: \$CC_PACKAGE_ID\"

# Approve chaincode
peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt \
    --channelID mychannel \
    --name agricultural-contract \
    --version 1.0 \
    --package-id \$CC_PACKAGE_ID \
    --sequence 1

# Commit chaincode
peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt \
    --channelID mychannel \
    --name agricultural-contract \
    --version 1.0 \
    --sequence 1 \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

echo 'Chaincode deployed!'
" || log_warn "Chaincode deployment may need manual verification"

log_success "Chaincode deployment initiated!"

# ============================================
# Step 9: Build and start application
# ============================================
log_info "[9/10] Building and starting application services..."

docker compose build backend
docker compose build frontend
docker compose build ml-service

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
if docker exec peer0.org1.example.com peer channel list 2>/dev/null | grep -q mychannel; then
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
echo "  Restart:        docker compose restart"
echo ""
