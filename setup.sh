#!/bin/bash
# ArduinoAI IDE - Setup Script
# Run with: chmod +x setup.sh && ./setup.sh

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}"
echo "  ┌─────────────────────────────────────┐"
echo "  │        ArduinoAI IDE Setup          │"
echo "  │   AI-Powered Arduino Development    │"
echo "  └─────────────────────────────────────┘"
echo -e "${NC}"

# Check Node.js
echo -e "${CYAN}▶ Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js >= 18${NC}"
    echo "  Download from: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version must be >= 18 (found v${NODE_VERSION})${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
echo -e "${CYAN}▶ Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Install dependencies
echo ""
echo -e "${CYAN}▶ Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# API Key setup
echo ""
echo -e "${YELLOW}▶ Anthropic API Key Setup${NC}"
echo -e "  The IDE requires a Claude API key from Anthropic."
echo -e "  Get one free at: ${CYAN}https://console.anthropic.com${NC}"
echo ""

read -p "  Enter your Anthropic API key (or press Enter to skip): " API_KEY

if [ -n "$API_KEY" ]; then
    echo "VITE_ANTHROPIC_API_KEY=$API_KEY" > .env
    echo -e "${GREEN}✓ API key saved to .env${NC}"
else
    echo -e "${YELLOW}⚠ Skipped — you can add it later in .env file${NC}"
    if [ ! -f .env ]; then
        echo "VITE_ANTHROPIC_API_KEY=your_api_key_here" > .env
        echo -e "  Created .env template. Edit it to add your key."
    fi
fi

# Summary
echo ""
echo -e "${GREEN}${BOLD}✅ Setup complete!${NC}"
echo ""
echo -e "  ${BOLD}To start the IDE:${NC}"
echo -e "  ${CYAN}npm run dev${NC}"
echo ""
echo -e "  ${BOLD}Then open:${NC}"
echo -e "  ${CYAN}http://localhost:5173${NC}"
echo ""
echo -e "  ${YELLOW}For direct upload, use Chrome or Edge browser${NC}"
echo ""
