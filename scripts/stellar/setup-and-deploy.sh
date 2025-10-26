#!/bin/bash

# Complete setup and deployment script for Stellar testnet
set -e

echo "🌟 Stellar Smart Contract Setup & Deployment"
echo "=============================================="
echo ""

# Step 1: Check if account exists
echo "Step 1: Checking for existing Stellar account..."
if stellar keys ls | grep -q "testnet-deployer"; then
    echo "✅ Account 'testnet-deployer' already exists"
else
    echo "Creating new testnet account..."
    stellar keys generate testnet-deployer --network testnet --fund
    echo "✅ Account created and funded with testnet XLM"
fi

# Display account address
echo ""
echo "Your testnet account address:"
stellar keys address testnet-deployer
echo ""

# Step 2: Build contracts
echo "Step 2: Building smart contracts..."
echo ""

echo "Building escrow contract..."
cd contracts/escrow
cargo build --target wasm32-unknown-unknown --release 2>&1 | grep -E "(Compiling|Finished)" || true
cd ../..

echo "Building crowdfunding contract..."
cd contracts/crowdfunding
cargo build --target wasm32-unknown-unknown --release 2>&1 | grep -E "(Compiling|Finished)" || true
cd ../..

echo "Building P2P contract..."
cd contracts/p2p
cargo build --target wasm32-unknown-unknown --release 2>&1 | grep -E "(Compiling|Finished)" || true
cd ../..

echo "✅ All contracts built"
echo ""

# Step 3: Deploy
echo "Step 3: Deploying to Stellar testnet..."
echo ""

export STELLAR_ACCOUNT=testnet-deployer
./scripts/stellar/deploy-testnet.sh

echo ""
echo "=============================================="
echo "🎉 Setup and deployment complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Copy the contract addresses: cp .env.testnet .env.local"
echo "2. Restart your dev server: npm run dev"
echo "3. Install a Stellar wallet like Freighter to test"
echo ""
