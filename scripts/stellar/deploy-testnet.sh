#!/bin/bash

# Stellar Testnet Deployment Script
# This script deploys all Soroban smart contracts to the Stellar testnet

set -e

echo "🚀 Starting Stellar Testnet Deployment..."

# Configuration
NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Error: stellar CLI is not installed"
    echo "Please install it from: https://developers.stellar.org/docs/tools/developer-tools"
    exit 1
fi

# Check if source account is set
if [ -z "$STELLAR_ACCOUNT" ]; then
    echo "❌ Error: STELLAR_ACCOUNT environment variable is not set"
    echo "Please set it to your testnet account name (from stellar keys list)"
    exit 1
fi

echo "📦 Building contracts..."

# Build escrow contract
echo "Building escrow contract..."
cd contracts/escrow
cargo build --target wasm32-unknown-unknown --release
cd ../..

# Build crowdfunding contract
echo "Building crowdfunding contract..."
cd contracts/crowdfunding
cargo build --target wasm32-unknown-unknown --release
cd ../..

# Build P2P contract
echo "Building P2P contract..."
cd contracts/p2p
cargo build --target wasm32-unknown-unknown --release
cd ../..

echo "✅ All contracts built successfully"

# Deploy contracts
echo ""
echo "🌐 Deploying to Stellar Testnet..."

# Deploy Escrow Contract
echo ""
echo "Deploying Escrow Contract..."
ESCROW_WASM="contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm"
ESCROW_ID=$(stellar contract deploy \
    --wasm "$ESCROW_WASM" \
    --source "$STELLAR_ACCOUNT" \
    --network "$NETWORK" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")

echo "✅ Escrow Contract deployed: $ESCROW_ID"

# Deploy Crowdfunding Contract
echo ""
echo "Deploying Crowdfunding Contract..."
CROWDFUNDING_WASM="contracts/crowdfunding/target/wasm32-unknown-unknown/release/crowdfunding_contract.wasm"
CROWDFUNDING_ID=$(stellar contract deploy \
    --wasm "$CROWDFUNDING_WASM" \
    --source "$STELLAR_ACCOUNT" \
    --network "$NETWORK" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")

echo "✅ Crowdfunding Contract deployed: $CROWDFUNDING_ID"

# Deploy P2P Contract
echo ""
echo "Deploying P2P Contract..."
P2P_WASM="contracts/p2p/target/wasm32-unknown-unknown/release/p2p_contract.wasm"
P2P_ID=$(stellar contract deploy \
    --wasm "$P2P_WASM" \
    --source "$STELLAR_ACCOUNT" \
    --network "$NETWORK" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")

echo "✅ P2P Contract deployed: $P2P_ID"

# Save contract addresses
echo ""
echo "💾 Saving contract addresses..."

cat > .env.testnet <<EOF
# Stellar Testnet Contract Addresses
# Generated on $(date)

NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=$RPC_URL
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=$NETWORK_PASSPHRASE

NEXT_PUBLIC_ESCROW_CONTRACT_ID=$ESCROW_ID
NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID=$CROWDFUNDING_ID
NEXT_PUBLIC_P2P_CONTRACT_ID=$P2P_ID
EOF

echo "✅ Contract addresses saved to .env.testnet"

# Display summary
echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "Contract Addresses:"
echo "  Escrow:       $ESCROW_ID"
echo "  Crowdfunding: $CROWDFUNDING_ID"
echo "  P2P:          $P2P_ID"
echo ""
echo "Network: Stellar Testnet"
echo "RPC URL: $RPC_URL"
echo ""
echo "Next steps:"
echo "1. Copy .env.testnet to .env.local"
echo "2. Update your application configuration"
echo "3. Test the contracts on testnet"
echo ""
