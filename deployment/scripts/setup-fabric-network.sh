#!/bin/bash

# Hyperledger Fabric Network Setup Script
# This script sets up a minimal single-org Fabric network for production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="${SCRIPT_DIR}/../fabric-network"

echo "================================================"
echo "  Hyperledger Fabric Network Setup"
echo "================================================"

# Create directory structure
mkdir -p "${NETWORK_DIR}/organizations/fabric-ca/org1"
mkdir -p "${NETWORK_DIR}/organizations/fabric-ca/orderer"
mkdir -p "${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp"
mkdir -p "${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls"
mkdir -p "${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
mkdir -p "${NETWORK_DIR}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp"
mkdir -p "${NETWORK_DIR}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls"
mkdir -p "${NETWORK_DIR}/channel-artifacts"

echo "[1/5] Generating crypto material..."

# Create CA server config for Org1
cat > "${NETWORK_DIR}/organizations/fabric-ca/org1/fabric-ca-server-config.yaml" << 'EOF'
version: 1.5.5
port: 7054
tls:
  enabled: true
  certfile:
  keyfile:
ca:
  name: ca-org1
csr:
  cn: ca.org1.example.com
  keyrequest:
    algo: ecdsa
    size: 256
  names:
    - C: US
      ST: North Carolina
      L: Durham
      O: org1.example.com
  hosts:
    - localhost
    - ca.org1.example.com
signing:
  default:
    usage:
      - digital signature
    expiry: 8760h
  profiles:
    ca:
      usage:
        - cert sign
        - crl sign
      expiry: 43800h
      caconstraint:
        isca: true
    tls:
      usage:
        - signing
        - key encipherment
        - server auth
        - client auth
      expiry: 8760h
EOF

echo "[2/5] Setting up crypto generation script..."

# Create cryptogen config
cat > "${NETWORK_DIR}/crypto-config.yaml" << 'EOF'
OrdererOrgs:
  - Name: Orderer
    Domain: example.com
    EnableNodeOUs: true
    Specs:
      - Hostname: orderer
        SANS:
          - localhost
          - orderer.example.com

PeerOrgs:
  - Name: Org1
    Domain: org1.example.com
    EnableNodeOUs: true
    Template:
      Count: 1
      SANS:
        - localhost
        - peer0.org1.example.com
    Users:
      Count: 1
EOF

echo "[3/5] Creating configtx.yaml..."

cat > "${NETWORK_DIR}/configtx.yaml" << 'EOF'
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
  TwoOrgsApplicationGenesis:
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

echo "[4/5] Creating channel creation script..."

cat > "${NETWORK_DIR}/create-channel.sh" << 'SCRIPT'
#!/bin/bash
set -e

CHANNEL_NAME="mychannel"

echo "Creating channel: ${CHANNEL_NAME}"

# Create genesis block
configtxgen -profile TwoOrgsApplicationGenesis -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID ${CHANNEL_NAME}

# Join orderer to channel
osnadmin channel join --channelID ${CHANNEL_NAME} --config-block ./channel-artifacts/${CHANNEL_NAME}.block -o orderer.example.com:7053 --ca-file ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt --client-cert ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt --client-key ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

# Join peer to channel
peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

echo "Channel ${CHANNEL_NAME} created successfully!"
SCRIPT
chmod +x "${NETWORK_DIR}/create-channel.sh"

echo "[5/5] Creating chaincode deployment script..."

cat > "${NETWORK_DIR}/deploy-chaincode.sh" << 'SCRIPT'
#!/bin/bash
set -e

CHAINCODE_NAME="agricultural-contract"
CHAINCODE_VERSION="1.0"
CHAINCODE_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/agricultural-contract"
CHANNEL_NAME="mychannel"
SEQUENCE=1

echo "Deploying chaincode: ${CHAINCODE_NAME}"

# Package chaincode
peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path ${CHAINCODE_PATH} --lang node --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}

# Install chaincode
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Get package ID
export CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" | awk -F "[, ]+" '{print $3}')
echo "Package ID: ${CC_PACKAGE_ID}"

# Approve chaincode
peer lifecycle chaincode approveformyorg -o orderer.example.com:7050 --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --package-id ${CC_PACKAGE_ID} --sequence ${SEQUENCE}

# Check commit readiness
peer lifecycle chaincode checkcommitreadiness --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --sequence ${SEQUENCE} --output json

# Commit chaincode
peer lifecycle chaincode commit -o orderer.example.com:7050 --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --sequence ${SEQUENCE} --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

echo "Chaincode ${CHAINCODE_NAME} deployed successfully!"
SCRIPT
chmod +x "${NETWORK_DIR}/deploy-chaincode.sh"

echo ""
echo "================================================"
echo "  Fabric network configuration created!"
echo "  Next step: Run 'generate-crypto.sh' on server"
echo "================================================"
