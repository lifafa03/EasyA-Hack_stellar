# 🔐 Trustless Work Integration Setup

## Current Status: DEMO MODE ⚠️

Your app is currently running in **DEMO MODE** because the Trustless Work contract ID is not configured. This means:

- ✅ Projects can be created
- ✅ Data saved to localStorage
- ✅ UI works perfectly
- ❌ No actual blockchain escrow contracts created
- ❌ No real fund transfers via Trustless Work

## What is Trustless Work?

Trustless Work is a platform that provides:
- **Smart Contract Escrows** on Stellar blockchain
- **Milestone-based Payments** for freelance projects
- **Yield-bearing Escrows** (earn interest on locked funds)
- **Dispute Resolution** mechanisms
- **Automated Releases** when milestones complete

## How to Enable Real Trustless Work

### Option 1: Get Trustless Work Credentials (Recommended for Production)

1. **Visit Trustless Work Platform**
   ```
   https://trustlesswork.com
   ```

2. **Create Account & Get API Access**
   - Sign up for developer access
   - Get your API key
   - Note your contract ID

3. **Update Environment Variables**
   ```bash
   # Edit .env.local
   NEXT_PUBLIC_TRUSTLESS_WORK_API=https://api.trustlesswork.com
   NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT=<your-contract-id>
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

5. **Test**
   - Create a project
   - Console should show: "✅ Real escrow created via Trustless Work API"
   - You'll get a real contract address on Stellar testnet

### Option 2: Deploy Your Own Escrow Contract (Advanced)

If Trustless Work doesn't have a public API, you can deploy your own escrow contract:

1. **Install Soroban CLI**
   ```bash
   cargo install --locked soroban-cli
   ```

2. **Write Escrow Smart Contract** (or use existing template)
   - See: https://soroban.stellar.org/docs/getting-started/hello-world
   - Example escrow contracts: https://github.com/stellar/soroban-examples

3. **Deploy to Testnet**
   ```bash
   soroban contract deploy \
     --wasm escrow.wasm \
     --source <your-secret-key> \
     --rpc-url https://soroban-testnet.stellar.org \
     --network-passphrase "Test SDF Network ; September 2015"
   ```

4. **Update Configuration**
   ```bash
   # Add deployed contract ID to .env.local
   NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT=<deployed-contract-id>
   ```

### Option 3: Continue with Demo Mode (For Hackathon/Testing)

If you just need to demo the app functionality:

1. **Keep Current Setup** - Demo mode works perfectly for UI/UX testing
2. **All Features Work** - Create projects, submit bids, view details
3. **No Real Transactions** - No actual blockchain escrow, just simulations

## Current Implementation

### Demo Mode Detection
```typescript
// lib/stellar/trustless-work.ts
const DEMO_MODE = !TRUSTLESS_WORK_CONFIG.contractId || contractId === '';

if (DEMO_MODE) {
  console.log('🎭 DEMO MODE: Simulating escrow creation');
  // Generate mock escrow ID
  // Save to localStorage
  // Return simulated success
} else {
  // Call real Trustless Work API
  // Create actual blockchain escrow
  // Return real contract address
}
```

### What Happens in Demo Mode

1. **Creating Project:**
   ```
   User submits form → Validates data → 
   Creates mock escrow ID → Saves to localStorage →
   Shows success (no blockchain transaction)
   ```

2. **Console Output:**
   ```
   🎭 DEMO MODE: Simulating escrow creation
   Generated Escrow ID: ESCROW_1738123456789_abc
   ✅ Project saved to storage
   ```

3. **Viewing Project:**
   ```
   Loads from localStorage → Shows real user data →
   Displays mock contract address
   ```

## Trustless Work API Integration

When you have real credentials, here's how it works:

### Creating Escrow
```typescript
// Real API call (when contractId is set)
const response = await axios.post(
  `${TRUSTLESS_WORK_CONFIG.apiUrl}/escrow/create`,
  {
    client: clientAddress,
    freelancer: freelancerAddress || null,
    amount: totalBudget,
    milestones: milestones,
    currency: 'USDC',
    enableYield: true
  },
  {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  }
);

// Returns:
{
  escrowId: "ESC_abc123",
  contractAddress: "GESCROW...",
  transaction: { /* XDR */ }
}
```

### Wallet Signs Transaction
```typescript
// User signs the escrow creation transaction
const signedTx = await signAndSubmitTransaction(
  transaction,
  walletType
);
```

### Funds Locked On-Chain
```typescript
// USDC transferred to escrow contract
// Held until milestones complete
// Earns yield while locked
```

## Testing Without Trustless Work

You can still test the complete flow in demo mode:

### Test Scenario 1: Full Project Flow
```bash
1. Connect Wallet (Freighter/Albedo)
2. Create Project:
   - Budget: 100 USDC
   - 3 Milestones
3. ✅ Success: Shows mock escrow ID
4. View Project: See your 100 USDC
5. Submit Bid as freelancer
6. ✅ Bid saved to localStorage
```

### Test Scenario 2: Multiple Projects
```bash
1. Create Project A (50 USDC)
2. Create Project B (75 USDC)
3. ✅ Both saved separately
4. View each project
5. ✅ Correct amounts shown
```

### Test Scenario 3: Validation System
```bash
1. Try creating project without wallet
2. ✅ Error: "Please connect wallet"
3. Connect wallet
4. Try with 0 USDC budget
5. ✅ Error: "Budget must be positive"
6. Fix and submit
7. ✅ Success with 5 checkpoints
```

## Environment Variables Reference

```bash
# .env.local

# Stellar Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# USDC Asset (Testnet)
NEXT_PUBLIC_USDC_ASSET_CODE=USDC
NEXT_PUBLIC_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5

# Trustless Work
NEXT_PUBLIC_TRUSTLESS_WORK_API=https://api.trustlesswork.com
NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT=  # Empty = DEMO MODE

# When you get credentials:
NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT=CA3D5KRYM6CB7OUQ6TWYRR3Z4T...
NEXT_PUBLIC_TRUSTLESS_WORK_API_KEY=tw_live_abc123...  # If needed
```

## Switching from Demo to Production

1. **Get Credentials**
   - Trustless Work account
   - API key
   - Contract ID

2. **Update .env.local**
   ```bash
   NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT=<real-contract-id>
   ```

3. **Restart Server**
   ```bash
   npm run dev
   ```

4. **Test**
   ```bash
   # Console should now show:
   ✅ Real escrow created via Trustless Work API
   Contract Address: GESCROW...
   Transaction Hash: abc123...
   ```

5. **Verify on Stellar**
   ```
   https://stellar.expert/explorer/testnet/tx/<transaction-hash>
   ```

## Troubleshooting

### "Failed to create escrow contract"
**Cause:** Trustless Work API not accessible

**Solutions:**
1. Check if API URL is correct
2. Verify API key (if required)
3. Ensure contract ID is valid
4. Fall back to demo mode (clear contract ID)

### "Demo mode still active"
**Cause:** Contract ID not properly set

**Solution:**
```bash
# Check .env.local
echo $NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT

# Should NOT be empty if you want real mode
# Restart dev server after changing
```

### "Transaction failed"
**Cause:** Wallet doesn't have USDC trustline

**Solution:**
```javascript
// User needs to add USDC trustline first
// See: lib/stellar/usdc.ts - addTrustline()
```

## Resources

- **Stellar Docs:** https://developers.stellar.org
- **Soroban Smart Contracts:** https://soroban.stellar.org
- **Stellar Expert (Explorer):** https://stellar.expert/explorer/testnet
- **Freighter Wallet:** https://www.freighter.app
- **Testnet Friendbot:** https://laboratory.stellar.org/#account-creator?network=test

## Summary

### For Hackathon/Demo: ✅ Current Setup Works!
- Demo mode active
- All UI/UX functional
- Data persists in localStorage
- No real blockchain needed

### For Production: ⚠️ Need Trustless Work Setup
- Get API credentials
- Deploy or use existing escrow contract
- Update environment variables
- Real blockchain transactions
- Actual USDC transfers

**Current Status:** Your app works perfectly in demo mode for testing and presenting! When you're ready for real escrow contracts, follow the steps above to integrate with Trustless Work or deploy your own smart contract.
