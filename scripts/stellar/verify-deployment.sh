#!/bin/bash

# Contract Deployment Verification Script
# This script verifies that deployed contracts are accessible and functional

set -e

echo "🔍 Verifying Stellar Contract Deployment..."

# Check which environment to verify
ENV_FILE="${1:-.env.testnet}"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Environment file $ENV_FILE not found"
    echo "Usage: $0 [env-file]"
    echo "Example: $0 .env.testnet"
    exit 1
fi

echo "Loading configuration from: $ENV_FILE"
source "$ENV_FILE"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Error: stellar CLI is not installed"
    exit 1
fi

# Verify environment variables are set
if [ -z "$NEXT_PUBLIC_ESCROW_CONTRACT_ID" ]; then
    echo "❌ Error: NEXT_PUBLIC_ESCROW_CONTRACT_ID not set in $ENV_FILE"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID" ]; then
    echo "❌ Error: NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID not set in $ENV_FILE"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_P2P_CONTRACT_ID" ]; then
    echo "❌ Error: NEXT_PUBLIC_P2P_CONTRACT_ID not set in $ENV_FILE"
    exit 1
fi

echo ""
echo "Contract Addresses:"
echo "  Escrow:       $NEXT_PUBLIC_ESCROW_CONTRACT_ID"
echo "  Crowdfunding: $NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID"
echo "  P2P:          $NEXT_PUBLIC_P2P_CONTRACT_ID"
echo ""

# Set network parameters
NETWORK="${NEXT_PUBLIC_STELLAR_NETWORK:-testnet}"
RPC_URL="${NEXT_PUBLIC_STELLAR_RPC_URL}"

echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo ""

# Function to verify contract
verify_contract() {
    local contract_name=$1
    local contract_id=$2
    
    echo "Verifying $contract_name contract..."
    
    # Try to fetch contract info
    if stellar contract inspect --id "$contract_id" --network "$NETWORK" --rpc-url "$RPC_URL" > /dev/null 2>&1; then
        echo "✅ $contract_name contract is accessible"
        return 0
    else
        echo "❌ $contract_name contract verification failed"
        return 1
    fi
}

# Verify each contract
FAILED=0

verify_contract "Escrow" "$NEXT_PUBLIC_ESCROW_CONTRACT_ID" || FAILED=$((FAILED + 1))
verify_contract "Crowdfunding" "$NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID" || FAILED=$((FAILED + 1))
verify_contract "P2P" "$NEXT_PUBLIC_P2P_CONTRACT_ID" || FAILED=$((FAILED + 1))

echo ""

if [ $FAILED -eq 0 ]; then
    echo "=========================================="
    echo "✅ All contracts verified successfully!"
    echo "=========================================="
    echo ""
    echo "Explorer URLs:"
    
    if [ "$NETWORK" = "mainnet" ]; then
        EXPLORER_PATH="public"
    else
        EXPLORER_PATH="testnet"
    fi
    
    echo "  Escrow:       https://stellar.expert/explorer/$EXPLORER_PATH/contract/$NEXT_PUBLIC_ESCROW_CONTRACT_ID"
    echo "  Crowdfunding: https://stellar.expert/explorer/$EXPLORER_PATH/contract/$NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID"
    echo "  P2P:          https://stellar.expert/explorer/$EXPLORER_PATH/contract/$NEXT_PUBLIC_P2P_CONTRACT_ID"
    echo ""
    exit 0
else
    echo "=========================================="
    echo "❌ Verification failed for $FAILED contract(s)"
    echo "=========================================="
    echo ""
    echo "Please check:"
    echo "1. Contract addresses are correct"
    echo "2. Network configuration is correct"
    echo "3. RPC endpoint is accessible"
    echo "4. Contracts were successfully deployed"
    echo ""
    exit 1
fi
