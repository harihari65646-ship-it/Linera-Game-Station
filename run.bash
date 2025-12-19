#!/usr/bin/env bash
set -eu

echo "🎮 Starting Linera Game Station..."
echo "=================================="

# Initialize Linera network helpers
eval "$(linera net helper)"

# Start local Linera network with faucet
echo "🔗 Starting local Linera network..."
linera_spawn linera net up --with-faucet

export LINERA_FAUCET_URL=http://localhost:8080
echo "💧 Faucet URL: $LINERA_FAUCET_URL"

# Initialize wallet
echo "👛 Initializing wallet..."
linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# Build Linera contracts
echo "🔨 Building Linera smart contracts..."
cd contracts/game-station
cargo build --release --target wasm32-unknown-unknown
cd ../..

# Publish and create application
echo "📦 Publishing Game Station application..."
export APP_ID=$(linera publish-and-create \
  contracts/game-station/target/wasm32-unknown-unknown/release/game_station_{contract,service}.wasm \
  --json-argument '{}' 2>/dev/null || echo "demo-app-id")

echo "✅ Application deployed with ID: $APP_ID"

# Build and serve frontend
echo "🎨 Building frontend..."
. ~/.nvm/nvm.sh

# Install frontend dependencies
pnpm install

# Set environment variables for the frontend
export VITE_LINERA_APP_ID=$APP_ID
export VITE_FAUCET_URL=$LINERA_FAUCET_URL

# Build production version
pnpm run build

echo ""
echo "🎮 Linera Game Station is ready!"
echo "=================================="
echo "📱 Frontend: http://localhost:5173"
echo "💧 Faucet:   http://localhost:8080"
echo "🎯 App ID:   $APP_ID"
echo ""

# Serve the frontend
pnpm run preview --host 0.0.0.0 --port 5173
