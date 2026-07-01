#!/bin/bash

# MOVTI VPN Shield - CRX Build Script
# This script builds CRX files for Chrome and Edge browsers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Extension directory
EXTENSION_DIR="vpn-extension"

# Get version from manifest.json
VERSION=$(jq -r '.version' "$EXTENSION_DIR/manifest.json")
echo -e "${BLUE}Building MOVTI VPN Shield v${VERSION}${NC}"

# Check if required tools are installed
check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is not installed${NC}"
        echo "Install it with: sudo apt-get install jq (Ubuntu) or brew install jq (macOS)"
        exit 1
    fi
    
    if ! command -v openssl &> /dev/null; then
        echo -e "${RED}Error: openssl is not installed${NC}"
        exit 1
    fi
    
    if ! command -v crx &> /dev/null; then
        echo -e "${YELLOW}Installing crx package...${NC}"
        npm install -g crx
    fi
    
    echo -e "${GREEN}All dependencies satisfied${NC}"
}

# Generate private key if it doesn't exist
generate_key() {
    local browser=$1
    local key_file="$EXTENSION_DIR/${browser}.pem"
    
    if [ ! -f "$key_file" ]; then
        echo -e "${YELLOW}Generating ${browser} private key...${NC}"
        openssl genrsa -out "$key_file" 2048
        echo -e "${GREEN}Generated ${browser} key: ${key_file}${NC}"
    else
        echo -e "${GREEN}Using existing ${browser} key${NC}"
    fi
}

# Build CRX for Chrome
build_chrome() {
    echo -e "${BLUE}Building Chrome CRX...${NC}"
    generate_key "chrome"
    
    cd "$EXTENSION_DIR"
    crx pack . -o "../movti-vpn-chrome-${VERSION}.crx" -p chrome.pem
    cd ..
    
    echo -e "${GREEN}Chrome CRX created: movti-vpn-chrome-${VERSION}.crx${NC}"
}

# Build CRX for Edge
build_edge() {
    echo -e "${BLUE}Building Edge CRX...${NC}"
    generate_key "edge"
    
    cd "$EXTENSION_DIR"
    crx pack . -o "../movti-vpn-edge-${VERSION}.crx" -p edge.pem
    cd ..
    
    echo -e "${GREEN}Edge CRX created: movti-vpn-edge-${VERSION}.crx${NC}"
}

# Build ZIP for Firefox
build_firefox() {
    echo -e "${BLUE}Building Firefox ZIP...${NC}"
    
    cd "$EXTENSION_DIR"
    zip -r "../movti-vpn-firefox-${VERSION}.zip" . -x "*.pem"
    cd ..
    
    echo -e "${GREEN}Firefox ZIP created: movti-vpn-firefox-${VERSION}.zip${NC}"
}

# Main function
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  MOVTI VPN Shield Build Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    check_dependencies
    
    echo ""
    echo -e "${YELLOW}Building extension packages...${NC}"
    echo ""
    
    build_chrome
    echo ""
    build_edge
    echo ""
    build_firefox
    
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Build completed successfully!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "Files created:"
    echo -e "  ${GREEN}• movti-vpn-chrome-${VERSION}.crx${NC}"
    echo -e "  ${GREEN}• movti-vpn-edge-${VERSION}.crx${NC}"
    echo -e "  ${GREEN}• movti-vpn-firefox-${VERSION}.zip${NC}"
    echo ""
    echo -e "${YELLOW}Installation Guide:${NC}"
    echo -e "Chrome: Drag .crx to chrome://extensions/"
    echo -e "Edge: Drag .crx to edge://extensions/"
    echo -e "Firefox: Extract .zip and load manifest.json in about:debugging"
}

# Parse command line arguments
case "${1:-all}" in
    chrome)
        check_dependencies
        build_chrome
        ;;
    edge)
        check_dependencies
        build_edge
        ;;
    firefox)
        check_dependencies
        build_firefox
        ;;
    all)
        main
        ;;
    *)
        echo "Usage: $0 {chrome|edge|firefox|all}"
        exit 1
        ;;
esac
