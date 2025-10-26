#!/bin/bash

# Stellar Mainnet Deployment Script
# This script deploys all Soroban smart contracts to the Stellar mainnet
# ⚠️  WARNING: This deploys to MAINNET with real funds!

set -e

echo "⚠️  WARNING: You are about to deploy to STELLAR MAINNET!"
echo "This will use real XLM and deploy production contracts."
echo ""
read -p "Are you sure you want to continue? (type 'yes' to proceed): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting Stellar Mainnet Deployment..."

# Configuration
NETWORK="mainnet"
RPC_URL="https://soroban-rpc.mainnet.stellar.org"
NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Error: stellar CLI is not installed"
    echo "Please install it from: https://developers.stellar.org/docs/tools/developer-tools"
    exit 1
fi

# Check if source account is set
if [ -z "$STELLAR_ACCOUNT" ]; then
    echo "❌ Error: STELLAR_ACCOUNT environment variable is not set"
    echo "Please set it to your mainnet account name (from stellar keys list)"
    exit 1
fi

# Verify contracts have been audited
echo ""
echo "⚠️  SECURITY CHECKLIST:"
echo "Have the smart contracts been:"
echo "  [ ] Professionally audited?"
echo "  [ ] Thoroughly tested on testnet?"
echo "  [ ] Reviewed by the team?"
echo ""
read -p "Confirm all security checks passed (type 'DEPLOY' to proceed): " security_confirm

if [ "$security_confirm" != "DEPLOY" ]; then
    echo "Deployment cancelled. Please complete security checks first."
    exit 0
fi

echo ""
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
echo "🌐 Deploying to Stellar Mainnet..."

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

cat > .env.mainnet <<EOF
# Stellar Mainnet Contract Addresses
# Generated on $(date)
# ⚠️  PRODUCTION ENVIRONMENT - DO NOT SHARE THESE ADDRESSES PUBLICLY

NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_STELLAR_RPC_URL=$RPC_URL
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=$NETWORK_PASSPHRASE

NEXT_PUBLIC_ESCROW_CONTRACT_ID=$ESCROW_ID
NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID=$CROWDFUNDING_ID
NEXT_PUBLIC_P2P_CONTRACT_ID=$P2P_ID
EOF

echo "✅ Contract addresses saved to .env.mainnet"

# Create backup
BACKUP_FILE=".env.mainnet.backup.$(date +%Y%m%d_%H%M%S)"
cp .env.mainnet "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Display summary
echo ""
echo "=========================================="
echo "🎉 Mainnet Deployment Complete!"
echo "=========================================="
echo ""
echo "Contract Addresses:"
echo "  Escrow:       $ESCROW_ID"
echo "  Crowdfunding: $CROWDFUNDING_ID"
echo "  P2P:          $P2P_ID"
echo ""
echo "Network: Stellar Mainnet (PRODUCTION)"
echo "RPC URL: $RPC_URL"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Verify contracts on Stellar Expert"
echo "2. Test all contract functions with small amounts"
echo "3. Update production environment variables"
echo "4. Monitor contract activity closely"
echo "5. Keep backup file secure: $BACKUP_FILE"
echo ""
echo "Stellar Expert URLs:"
echo "  Escrow:       https://stellar.expert/explorer/public/contract/$ESCROW_ID"
echo "  Crowdfunding: https://stellar.expert/explorer/public/contract/$CROWDFUNDING_ID"
echo "  P2P:          https://stellar.expert/explorer/public/contract/$P2P_ID"
echo ""
