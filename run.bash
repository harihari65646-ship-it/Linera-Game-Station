#!/bin/bash
set -e

echo "🎮 Neon Arcade - Local Conway Network Setup"
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set up PATH for nvm, rust, and linera
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$HOME/.cargo/bin:/usr/local/bin:$PATH"

echo -e "${BLUE}Step 1/8:${NC} Installing frontend dependencies..."
npm install --legacy-peer-deps

echo -e "${BLUE}Step 2/8:${NC} Building Linera contracts..."
cd /build/contracts/game-station
cargo build --release --target wasm32-unknown-unknown

echo -e "${BLUE}Step 3/8:${NC} Starting LOCAL Conway network..."
cd /build

# Start local Conway network (NOT connecting to public testnet!)
linera net up > /tmp/linera_net.log 2>&1 &
LINERA_NET_PID=$!

echo "Waiting for local network to initialize..."
sleep 20  # Give network time to create wallet files

# Extract wallet paths from log
if [ -f /tmp/linera_net.log ]; then
  export LINERA_WALLET=$(grep -oP 'LINERA_WALLET="\K[^"]+' /tmp/linera_net.log 2>/dev/null | head -1)
  export LINERA_KEYSTORE=$(grep -oP 'LINERA_KEYSTORE="\K[^"]+' /tmp/linera_net.log 2>/dev/null | head -1)
  export LINERA_STORAGE=$(grep -oP 'LINERA_STORAGE="\K[^"]+' /tmp/linera_net.log 2>/dev/null | head -1)

  # Fallback pattern if Perl regex not available
  if [ -z "$LINERA_WALLET" ]; then
    export LINERA_WALLET=$(grep 'LINERA_WALLET=' /tmp/linera_net.log | head -1 | cut -d'"' -f2)
    export LINERA_KEYSTORE=$(grep 'LINERA_KEYSTORE=' /tmp/linera_net.log | head -1 | cut -d'"' -f2)
    export LINERA_STORAGE=$(grep 'LINERA_STORAGE=' /tmp/linera_net.log | head -1 | cut -d'"' -f2)
  fi

  if [ -n "$LINERA_WALLET" ]; then
    echo -e "${GREEN}✅ Local Conway network started${NC}"
    echo -e "${GREEN}   Wallet: $LINERA_WALLET${NC}"
  else
    echo -e "${YELLOW}⚠️  Warning: Could not extract wallet paths${NC}"
    cat /tmp/linera_net.log
  fi
else
  echo -e "${YELLOW}⚠️  Warning: Network log not found${NC}"
fi

echo -e "${BLUE}Step 4/8:${NC} Deploying contracts to LOCAL network..."
cd /build/contracts/game-station

# Verify WASM files exist
if [ ! -f target/wasm32-unknown-unknown/release/game_station_contract.wasm ]; then
  echo -e "${YELLOW}⚠️  ERROR: game_station_contract.wasm not found!${NC}"
  exit 1
fi

echo "Deploying to LOCAL Conway network..."
set +e  # Temporarily disable exit-on-error
APP_OUTPUT=$(linera --wait-for-outgoing-messages publish-and-create \
  target/wasm32-unknown-unknown/release/game_station_{contract,service}.wasm \
  --json-argument "null" 2>&1)
DEPLOY_EXIT_CODE=$?
set -e

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
  echo -e "${YELLOW}⚠️  ERROR: Deployment failed!${NC}"
  echo "$APP_OUTPUT"
  exit 1
fi

# Extract Application ID from local deployment
APP_ID=$(echo "$APP_OUTPUT" | grep -oP 'Application ID: \K[a-f0-9]+' || echo "")

if [ -z "$APP_ID" ]; then
  echo -e "${YELLOW}⚠️  Could not extract Application ID${NC}"
  echo "$APP_OUTPUT"
else
  echo -e "${GREEN}✅ Application deployed to LOCAL network${NC}"
  echo -e "${GREEN}   Application ID: $APP_ID${NC}"
fi

# Extract Chain ID from wallet
DEFAULT_CHAIN=$(linera wallet show | grep -oP 'Default chain: \K[a-f0-9]+' || echo "")

echo -e "${BLUE}Step 5/8:${NC} Generating frontend config for LOCAL network..."

# Create .env.local with LOCAL Docker URLs (NOT public Conway!)
cat > /build/.env.local <<EOF
# Local Conway Network (running inside Docker)
VITE_LINERA_APP_ID=${APP_ID}
VITE_LINERA_CHAIN_ID=${DEFAULT_CHAIN}

# Local Docker endpoints (NOT public testnet!)
VITE_LINERA_FAUCET_URL=http://localhost:8080
VITE_LINERA_GRAPHQL_URL=http://localhost:9002/chains/${DEFAULT_CHAIN}/applications/${APP_ID}
VITE_LINERA_SERVICE_URL=http://localhost:9002
EOF

echo -e "${GREEN}✅ Frontend configured for LOCAL network${NC}"
cat /build/.env.local

echo -e "${BLUE}Step 6/8:${NC} Starting Linera GraphQL service..."
cd /build
linera service --port 9002 > /tmp/linera_service.log 2>&1 &
SERVICE_PID=$!
sleep 8

echo -e "${BLUE}Step 7/8:${NC} Starting frontend (Vite dev server)..."
npm run dev -- --host 0.0.0.0 > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!

echo -e "${BLUE}Step 8/8:${NC} Waiting for frontend to start..."
sleep 15

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Neon Arcade is running on LOCAL Conway!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🎮 Frontend:${NC}      http://localhost:5173"
echo -e "${BLUE}🔗 GraphQL API:${NC}   http://localhost:9002/graphql"
echo -e "${BLUE}💰 Local Faucet:${NC}  http://localhost:8080"
echo ""
echo -e "${GREEN}📊 LOCAL NETWORK INFO:${NC}"
echo -e "${GREEN}   Chain ID:      ${DEFAULT_CHAIN}${NC}"
echo -e "${GREEN}   App ID:        ${APP_ID}${NC}"
echo -e "${GREEN}   Network:       Local Conway (inside Docker)${NC}"
echo ""
echo -e "${YELLOW}⚠️  This is a LOCAL network - no internet required!${NC}"
echo -e "${YELLOW}   Judges can run this completely offline.${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Trap signals for cleanup
cleanup() {
  echo ""
  echo "Stopping services..."
  kill $FRONTEND_PID $SERVICE_PID $LINERA_NET_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGTERM SIGINT

# Wait forever (or until Ctrl+C)
wait
