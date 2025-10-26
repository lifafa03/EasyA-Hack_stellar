# StellarWork+ Stellar Integration Guide

## 🚀 Complete Setup Instructions

This guide will walk you through setting up StellarWork+ with full Stellar blockchain integration, including Trustless Work escrow system.

---

## 📋 Prerequisites

### 1. Install Node.js and npm

```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from: https://nodejs.org/
# Or install via Homebrew on macOS:
brew install node
```

### 2. Verify Installation

```bash
cd /Users/solipuram.rohanreddy/Desktop/EasyA-Hack_stellar
node --version  # Should show v18+ or v20+
npm --version   # Should show v9+ or v10+
```

---

## 📦 Step 1: Install Dependencies

```bash
# Install all project dependencies
npm install

# This will install:
# - @stellar/stellar-sdk (Stellar blockchain SDK)
# - @stellar/freighter-api (Wallet integration)
# - axios (HTTP client for Trustless Work API)
# - bignumber.js (Precision math for crypto amounts)
# - All UI and Next.js dependencies
```

---

## 🔑 Step 2: Configure Environment Variables

The `.env.local` file has been created. Update these values:

```env
# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Trustless Work API Configuration
NEXT_PUBLIC_TRUSTLESS_WORK_API=https://api.trustlesswork.com
NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT=<GET_FROM_TRUSTLESS_WORK>

# USDC Configuration (Testnet)
NEXT_PUBLIC_USDC_ASSET_CODE=USDC
NEXT_PUBLIC_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

### Get Trustless Work Contract ID:
1. Visit: https://github.com/Trustless-Work
2. Check their documentation or API docs
3. Look for testnet contract addresses
4. Update `NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT`

---

## 🌐 Step 3: Install Stellar Wallet

### Option 1: Freighter (Recommended)

1. Install Freighter browser extension:
   - Chrome: https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/freighter/

2. Create a new wallet or import existing
3. Switch to **Testnet** in Freighter settings

### Option 2: Albedo

1. Visit: https://albedo.link
2. No installation required (web-based)
3. Create account or import existing

---

## 💰 Step 4: Fund Your Testnet Account

### Get Free Testnet XLM:

1. Open Freighter and copy your public key (starts with `G`)
2. Visit Stellar Laboratory: https://laboratory.stellar.org/#account-creator
3. Paste your public key and click "Create Account"
4. You'll receive 10,000 test XLM

### Get Testnet USDC:

1. Visit: https://testnet.stellar.org
2. Follow instructions to add USDC trustline
3. Request testnet USDC from faucet

---

## 🏗️ Step 5: Run the Application

### Development Mode:

```bash
npm run dev
```

Visit: http://localhost:3000

### Build for Production:

```bash
npm run build
npm start
```

---

## ✅ Step 6: Test Wallet Connection

1. Open the app at http://localhost:3000
2. Click "Connect Wallet" in navigation
3. Select "Freighter"
4. Approve connection in Freighter popup
5. You should see your address and balances displayed

**✅ CHECKPOINT 1:** Wallet connection successful if you see your address in navigation bar.

---

## 🧪 Step 7: Test Project Creation with Escrow

1. Click "Post Project" in navigation
2. Fill out project details:
   - Title: "Test Escrow Project"
   - Budget: 100 USDC
   - Add at least 1 milestone
3. Click "Publish Project"
4. Approve transaction in Freighter
5. Wait for confirmation

**✅ CHECKPOINT 2:** Project created successfully if you see transaction hash and escrow ID.

---

## 📊 What's Been Implemented

### ✅ Completed Features:

1. **Stellar SDK Integration**
   - Full Stellar SDK setup
   - Network configuration (testnet/mainnet)
   - Horizon and Soroban RPC integration

2. **Wallet Connectivity**
   - Freighter wallet integration
   - Albedo wallet support
   - Auto-reconnection on page reload
   - Real-time balance updates
   - Wallet state management

3. **Trustless Work Integration**
   - Escrow creation API calls
   - Milestone management
   - Funding and payment releases
   - Yield-bearing escrow support
   - Dispute handling

4. **Smart Contract Layer**
   - Contract invocation utilities
   - State reading functions
   - Transaction simulation
   - Event monitoring

5. **Validation & Error Handling**
   - 5 checkpoint validators:
     - Wallet connection validation
     - Transaction structure validation
     - Escrow parameter validation
     - Auto-retry with exponential backoff
     - Contract call validation
   - Auto-correction of common errors
   - Verbose logging and user feedback

6. **UI Components**
   - Wallet connect button with dialog
   - Balance display
   - Connection status indicators
   - Toast notifications for all actions

### 🚧 In Progress:

7. **Post Project Integration** (Current)
   - Converting mock project creation to real escrow deployment
   - Integrating Trustless Work API
   - Adding wallet requirement checks

### 📝 Remaining Tasks:

8. **Bidding System** - Convert bids to on-chain proposals
9. **Investor Pooling** - Add yield-bearing escrow options
10. **USDC Payments** - Complete stablecoin integration
11. **Real-time Data Sync** - Blockchain state updates

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@stellar/stellar-sdk'"

**Solution:** Run `npm install` to install dependencies

### Error: "Freighter wallet not installed"

**Solution:** 
1. Install Freighter from Chrome/Firefox store
2. Refresh the page
3. Try connecting again

### Error: "Account not found on network"

**Solution:**
1. Your account isn't funded on testnet
2. Visit https://laboratory.stellar.org/#account-creator
3. Fund your account with test XLM

### Error: "Transaction failed"

**Solutions:**
1. Check if you have enough XLM for fees (at least 1 XLM)
2. Verify network is set to testnet
3. Check console for specific error
4. Auto-retry should attempt 3 times automatically

### TypeScript/Lint Errors in IDE

**These are expected before running `npm install`**
- The packages aren't installed yet
- Errors will disappear after installation

---

## 🎯 Validation Checkpoints

The system automatically validates all operations:

### Checkpoint 1: Wallet Connection
- ✅ Validates public key format
- ✅ Checks account exists on network
- ✅ Verifies sufficient balance
- **Auto-correction:** Shows funding instructions if account doesn't exist

### Checkpoint 2: Transaction Validation
- ✅ Validates transaction structure
- ✅ Checks sequence numbers
- ✅ Verifies fee amounts
- **Auto-correction:** Rebuilds transaction with correct sequence

### Checkpoint 3: Escrow Creation
- ✅ Validates client/freelancer addresses
- ✅ Checks budget amounts
- ✅ Validates milestone structure
- ✅ Verifies client balance
- **Auto-correction:** Suggests budget adjustments if insufficient

### Checkpoint 4: Auto-Retry
- ✅ Retries failed operations 3 times
- ✅ Exponential backoff (2 seconds delay)
- ✅ Shows progress to user
- **Auto-correction:** Handles temporary network issues

### Checkpoint 5: Contract Calls
- ✅ Validates contract ID format
- ✅ Checks method names
- ✅ Validates arguments
- **Auto-correction:** Provides helpful error messages

---

## 📚 File Structure

```
lib/stellar/
├── config.ts              # Network configuration
├── wallet.ts              # Wallet connection logic
├── trustless-work.ts      # Trustless Work API integration
├── contracts.ts           # Smart contract utilities
└── validation.ts          # Checkpoint validation system

hooks/
└── use-wallet.ts          # React hook for wallet state

components/
└── wallet-connect.tsx     # Wallet UI component
```

---

## 🔗 Resources

### Stellar Documentation:
- Official Docs: https://developers.stellar.org
- Soroban (Smart Contracts): https://soroban.stellar.org
- Stellar Laboratory: https://laboratory.stellar.org

### Trustless Work:
- GitHub: https://github.com/Trustless-Work
- Main dApp: https://github.com/Trustless-Work/dApp-Trustless-Work
- Demo: https://github.com/Trustless-Work/demo-Trustless-Work

### Wallets:
- Freighter: https://freighter.app
- Albedo: https://albedo.link

### Testnet Resources:
- Horizon Testnet: https://horizon-testnet.stellar.org
- Account Creator: https://laboratory.stellar.org/#account-creator
- Testnet Info: https://developers.stellar.org/docs/fundamentals-and-concepts/testnet-and-pubnet

---

## 🎉 Next Steps After Setup

1. **Test all checkpoints** - Ensure validation system works
2. **Create test project** - Deploy first escrow contract
3. **Test bidding** - Submit and accept bids on-chain
4. **Add investor funding** - Test pooled funding feature
5. **Monitor transactions** - Check Stellar Expert for your transactions

### View Your Transactions:
Visit: `https://stellar.expert/explorer/testnet/account/YOUR_PUBLIC_KEY`

---

## 💡 Tips for GLM 4.6 Prompting

When working with AI to build features, use these prompts:

### For New Features:
```
Build a Stellar-integrated [feature name] component that:
1. Uses the existing wallet connection from useWallet hook
2. Calls the Trustless Work API via lib/stellar/trustless-work.ts
3. Implements checkpoint validation from lib/stellar/validation.ts
4. Shows toast notifications for success/error states
5. Handles wallet disconnection gracefully
6. Includes loading states and error boundaries

The component should integrate with the existing StellarWork+ UI theme (green accent color #4ade80).

Reference existing code structure from:
- components/wallet-connect.tsx for UI patterns
- hooks/use-wallet.ts for state management
- lib/stellar/trustless-work.ts for API calls
```

### For Bug Fixes:
```
Debug this Stellar transaction error:
[paste error]

Context:
- Using Stellar SDK version 13.2.0
- Connected to testnet via Horizon
- User wallet: [address]
- Transaction type: [escrow/payment/contract]

Check:
1. Sequence numbers (run validateTransaction checkpoint)
2. Account balances and reserves
3. Fee amounts
4. Network configuration
5. Trustline existence for USDC

Provide auto-correction strategy if possible.
```

---

## 🔄 Auto-Correction Examples

The system auto-corrects these common issues:

### Issue: Sequence Number Mismatch
**Detection:** Checkpoint 2 validates sequence
**Auto-correction:** Fetches latest sequence and rebuilds transaction

### Issue: Account Not Found
**Detection:** Checkpoint 1 checks account existence
**Auto-correction:** Provides testnet funding link

### Issue: Insufficient Fee
**Detection:** Checkpoint 2 validates fees
**Auto-correction:** Calculates recommended fee and warns user

### Issue: Network Timeout
**Detection:** Checkpoint 4 retry mechanism
**Auto-correction:** Retries with exponential backoff

---

## 📞 Support & Contributing

### Need Help?
1. Check troubleshooting section above
2. Review Stellar documentation
3. Check Trustless Work examples
4. Review validation checkpoint logs

### Want to Contribute?
1. Follow existing code patterns
2. Add checkpoint validation for new features
3. Include error handling and retries
4. Update this guide with new features

---

**You're now ready to build the future of decentralized work on Stellar! 🚀**
