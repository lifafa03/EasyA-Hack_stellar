# Stellar Smart Contract Deployment Guide

This guide will walk you through deploying your Stellar smart contracts to testnet.

## Prerequisites

✅ Docker Desktop installed (you have this)
✅ Stellar CLI installed (you have this)
⏳ Stellar testnet account (we'll create this)

## Step 1: Create a Stellar Testnet Account

First, generate a new keypair for testnet:

```bash
stellar keys generate testnet-deployer --network testnet
```

This will create a new account named "testnet-deployer" and automatically fund it with testnet XLM.

## Step 2: Verify Your Account

Check that your account was created:

```bash
stellar keys ls
```

You should see "testnet-deployer" in the list.

Get your account address:

```bash
stellar keys address testnet-deployer
```

## Step 3: Build the Smart Contracts

The contracts need to be compiled to WebAssembly. Run:

```bash
# Build escrow contract
cd contracts/escrow
cargo build --target wasm32-unknown-unknown --release
cd ../..

# Build crowdfunding contract
cd contracts/crowdfunding
cargo build --target wasm32-unknown-unknown --release
cd ../..

# Build P2P contract
cd contracts/p2p
cargo build --target wasm32-unknown-unknown --release
cd ../..
```

## Step 4: Deploy to Testnet

Set your account name as an environment variable:

```bash
export STELLAR_ACCOUNT=testnet-deployer
```

Run the deployment script:

```bash
chmod +x scripts/stellar/deploy-testnet.sh
./scripts/stellar/deploy-testnet.sh
```

## Step 5: Configure Your Application

After deployment, copy the generated environment file:

```bash
cp .env.testnet .env.local
```

## Step 6: Restart Your Development Server

Restart your Next.js app to pick up the new contract addresses:

```bash
npm run dev
```

## Troubleshooting

### "stellar CLI is not installed"
- The CLI is already installed, this shouldn't happen

### "STELLAR_ACCOUNT environment variable is not set"
- Run: `export STELLAR_ACCOUNT=testnet-deployer`

### "Account not found"
- Make sure you generated the account in Step 1
- Check with: `stellar keys ls`

### Build errors
- Make sure Rust is installed: `rustc --version`
- Install Rust if needed: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Add wasm target: `rustup target add wasm32-unknown-unknown`

## What's Next?

Once deployed, you can:
1. Test wallet connections with Freighter or other Stellar wallets
2. Create test escrow contracts
3. Test crowdfunding pools
4. Monitor transactions on Stellar Expert: https://stellar.expert/explorer/testnet

## Network Information

- **Network**: Stellar Testnet
- **RPC URL**: https://soroban-testnet.stellar.org
- **Network Passphrase**: Test SDF Network ; September 2015
- **Explorer**: https://stellar.expert/explorer/testnet
- **Friendbot (Faucet)**: https://friendbot.stellar.org

## Important Notes

⚠️ **Testnet tokens have no real value** - This is for testing only
⚠️ **Keep your keys safe** - Even on testnet, protect your private keys
⚠️ **Testnet resets** - The testnet may be reset periodically, requiring redeployment
