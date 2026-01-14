#!/bin/bash

# ============================================
# One-Command Server Setup for UpCloud
# Run this FIRST on a fresh Ubuntu 22.04 server
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "============================================"
echo "  UpCloud Server Initial Setup"
echo "============================================"
echo ""

# Update system
echo -e "${BLUE}[1/6]${NC} Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install essential tools
echo -e "${BLUE}[2/6]${NC} Installing essential tools..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    htop \
    nano \
    ufw \
    fail2ban

# Install Docker
echo -e "${BLUE}[3/6]${NC} Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed!${NC}"
else
    echo -e "${YELLOW}Docker already installed${NC}"
fi

# Install Docker Compose plugin
echo -e "${BLUE}[4/6]${NC} Ensuring Docker Compose..."
sudo apt-get install -y docker-compose-plugin

# Configure firewall
echo -e "${BLUE}[5/6]${NC} Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 3001/tcp  # Frontend (direct)
sudo ufw allow 5000/tcp  # ML Service
sudo ufw --force enable

# Configure swap (important for 4GB RAM)
echo -e "${BLUE}[6/6]${NC} Configuring swap space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo -e "${GREEN}2GB swap created!${NC}"
else
    echo -e "${YELLOW}Swap already configured${NC}"
fi

echo ""
echo "============================================"
echo -e "${GREEN}  Server Setup Complete!${NC}"
echo "============================================"
echo ""
echo "IMPORTANT: You need to logout and login again"
echo "for Docker group permissions to take effect."
echo ""
echo "Next steps:"
echo "  1. Logout:  exit"
echo "  2. Login again via SSH"
echo "  3. Clone your repo:"
echo "     git clone <your-repo-url>"
echo "  4. Configure environment:"
echo "     cd agricultural-supply-chain/deployment"
echo "     cp .env.template .env"
echo "     nano .env  # Fill in your values"
echo "  5. Run deployment:"
echo "     chmod +x scripts/*.sh"
echo "     ./scripts/deploy.sh"
echo ""
