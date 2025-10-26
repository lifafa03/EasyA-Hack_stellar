#!/bin/bash

# Deploy contracts to local Stellar standalone network (Docker)
set -e

echo "🚀 Deploying to Stellar Standalone (Local Docker)"
echo "=================================================="
echo ""

# Check if Docker container is running
if ! docker ps | grep -q algokit_sandbox; then
    echo "❌ Error: Docker container 'algokit_sandbox' is not running"
    echo "Please start it first with: docker start algokit_sandbox"
    exit 1
fi

# Set network to standalone
export STELLAR_NETWORK=standalone
export STELLAR_RPC_URL=http://localhost:8000/soroban/rpc

# Create or use local account
echo "Setting up local account..."
if stellar keys ls | grep -q "local-deployer"; then
    echo "✅ Using existing 'local-deployer' account"
else
    echo "Creating new local account..."
    stellar keys generate local-deployer --network standalone
    
    # Fund the account using friendbot (if available) or root account
    echo "Funding account..."
    # Note: You may need to manually fund this from the root account
fi

export STELLAR_ACCOUNT=local-deployer

echo ""
echo "Deploying contracts..."
echo ""

# Deploy Escrow Contract
echo "1. Deploying Escrow Contract..."
ESCROW_ID=$(stellar contract deploy \
    --wasm contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm \
    --source local-deployer \
    --network standalone \
    --rpc-url http://localhost:8000/soroban/rpc)
echo "✅ Escrow Contract: $ESCROW_ID"

# Deploy Crowdfunding Contract
echo ""
echo "2. Deploying Crowdfunding Contract..."
CROWDFUNDING_ID=$(stellar contract deploy \
    --wasm contracts/crowdfunding/target/wasm32-unknown-unknown/release/crowdfunding_contract.wasm \
    --source local-deployer \
    --network standalone \
    --rpc-url http://localhost:8000/soroban/rpc)
echo "✅ Crowdfunding Contract: $CROWDFUNDING_ID"

# Deploy P2P Contract
echo ""
echo "3. Deploying P2P Contract..."
P2P_ID=$(stellar contract deploy \
    --wasm contracts/p2p/target/wasm32-unknown-unknown/release/p2p_contract.wasm \
    --source local-deployer \
    --network standalone \
    --rpc-url http://localhost:8000/soroban/rpc)
echo "✅ P2P Contract: $P2P_ID"

# Save to .env.standalone
echo ""
echo "Saving contract addresses to .env.standalone..."
cat > .env.standalone << EOF
# Stellar Standalone (Local Docker) Configuration
# Generated on $(date)

NEXT_PUBLIC_STELLAR_NETWORK=standalone
NEXT_PUBLIC_STELLAR_RPC_URL=http://localhost:8000/soroban/rpc
NEXT_PUBLIC_STELLAR_HORIZON_URL=http://localhost:8000
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Standalone Network ; February 2017

NEXT_PUBLIC_ESCROW_CONTRACT_ID=$ESCROW_ID
NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID=$CROWDFUNDING_ID
NEXT_PUBLIC_P2P_CONTRACT_ID=$P2P_ID
EOF

echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "Contract Addresses:"
echo "  Escrow:       $ESCROW_ID"
echo "  Crowdfunding: $CROWDFUNDING_ID"
echo "  P2P:          $P2P_ID"
echo ""
echo "Next steps:"
echo "1. Copy config: cp .env.standalone .env.local"
echo "2. Restart dev server: npm run dev"
echo ""
