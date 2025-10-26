# SEP-24 Off-Ramp Implementation

## Overview
This document describes the complete SEP-24 withdrawal implementation for converting USDC to fiat currency via Stellar anchors.

## Architecture

### API Routes (Server-Side)
All sensitive operations are handled server-side to keep secrets secure:

1. **`/api/sep10/challenge`** (GET)
   - Fetches SEP-10 authentication challenge from anchor
   - Query params: `account` (user's public key)
   - Returns: `{ transaction: challengeXDR, network_passphrase }`

2. **`/api/sep10/token`** (POST)
   - Exchanges signed challenge for JWT token
   - Body: `{ signedTransaction: signedXDR }`
   - Returns: `{ token: jwtToken }`

3. **`/api/sep24/info`** (GET)
   - Gets withdrawal asset information
   - Returns: min/max amounts, fees, enabled status

4. **`/api/sep24/withdraw`** (POST)
   - Initiates interactive withdrawal
   - Body: `{ asset_code, asset_issuer, account, amount, token }`
   - Returns: `{ url: interactiveURL, id: transactionId }`

5. **`/api/sep24/transaction`** (GET)
   - Polls transaction status
   - Query params: `id` (transaction ID), `token` (JWT)
   - Returns: `{ transaction: { status, ... } }`

### Client-Side UI (`/ramp` page)

#### State Management
```typescript
const [withdrawAmount, setWithdrawAmount] = useState('10');
const [jwtToken, setJwtToken] = useState<string | null>(null);
const [withdrawalUrl, setWithdrawalUrl] = useState<string | null>(null);
const [transactionId, setTransactionId] = useState<string | null>(null);
```

#### Core Functions

**1. initiateWithdrawal()**
Full 4-step withdrawal process:

- **Step 1**: Get SEP-10 challenge
  ```typescript
  GET /api/sep10/challenge?account={publicKey}
  ```

- **Step 2**: Sign challenge with wallet
  ```typescript
  // Uses Freighter or Albedo to sign
  signedXdr = await window.freighterApi.signTransaction(...)
  ```

- **Step 3**: Get JWT token
  ```typescript
  POST /api/sep10/token
  Body: { signedTransaction: signedXdr }
  ```

- **Step 4**: Initiate withdrawal
  ```typescript
  POST /api/sep24/withdraw
  Body: { asset_code: 'USDC', account, amount, token }
  ```

- Opens interactive KYC popup window
- Stores transaction ID and withdrawal URL

**2. checkWithdrawalStatus()**
```typescript
GET /api/sep24/transaction?id={transactionId}
Headers: { Authorization: `Bearer ${jwtToken}` }
```

## User Flow

1. **Prerequisite**: User must have USDC balance
   - Swap XLM → USDC on DEX if needed
   - Or receive USDC from another account

2. **Initiate Withdrawal**:
   - Enter amount to withdraw
   - Click "🏦 Withdraw to Bank"
   - Wallet prompts to sign SEP-10 challenge
   - System authenticates with anchor
   - Interactive KYC popup opens

3. **Complete KYC**:
   - Fill out anchor's withdrawal form
   - Provide bank details
   - Submit KYC information

4. **Monitor Status**:
   - Click "Check Status" to poll transaction
   - Status transitions:
     - `incomplete` → KYC not submitted
     - `pending_user_transfer_start` → Waiting for user action
     - `pending_anchor` → Anchor processing
     - `completed` → Fiat sent to bank

## Security Considerations

### Server-Side Secrets
- All anchor communication happens through API routes
- No sensitive data exposed to client
- JWT tokens managed securely

### Wallet Integration
- Only signs SEP-10 challenge (doesn't sign actual withdrawal)
- Uses existing `useWallet` hook for consistency
- Supports both Freighter and Albedo wallets

### Challenge Validation
- SEP-10 challenge prevents replay attacks
- Time-limited JWT tokens
- Network passphrase validation

## Testing on Testnet

### Prerequisites
1. Wallet connected (Freighter or Albedo)
2. USDC trustline established
3. USDC balance > 0

### Test Anchor
- **Domain**: testanchor.stellar.org
- **Network**: Stellar Testnet
- **USDC Issuer**: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`

### Steps to Test
1. Navigate to `/ramp` page
2. Connect wallet (should auto-connect if previously connected)
3. Swap XLM → USDC if needed (get some USDC)
4. Scroll to "SEP-24 Withdrawal" section
5. Enter withdrawal amount
6. Click "Withdraw to Bank"
7. Sign the challenge in your wallet
8. Complete KYC form in popup
9. Click "Check Status" to monitor progress

### Expected Behavior
- Authentication should complete successfully
- Popup opens with anchor's form
- Transaction ID is displayed
- Status can be polled
- Toast notifications show progress

## Code Locations

### API Routes
- `app/api/sep10/challenge/route.ts`
- `app/api/sep10/token/route.ts`
- `app/api/sep24/info/route.ts`
- `app/api/sep24/withdraw/route.ts`
- `app/api/sep24/transaction/route.ts`

### UI Components
- `app/ramp/page.tsx` - Main off-ramp interface
- `components/navigation.tsx` - Added "💰 Off-Ramp" link

### Configuration
- `.env` - Contains `ANCHOR_DOMAIN` and `USDC_ISSUER_TESTNET`

## Troubleshooting

### "Wallet not connected"
- Ensure Freighter/Albedo is installed
- Click connect button in header
- Check wallet is unlocked

### "Failed to get challenge"
- Verify testanchor.stellar.org is accessible
- Check network connection
- Ensure account exists on-chain

### "Failed to get token"
- Verify challenge was signed correctly
- Check wallet signed with correct network passphrase
- Ensure challenge hasn't expired

### "Failed to initiate withdrawal"
- Verify JWT token is valid
- Check withdrawal amount is valid
- Ensure USDC balance is sufficient

### Popup blocked
- Allow popups for localhost
- Manually click the withdrawal URL

## Next Steps

### Production Deployment
1. **Update Anchor Domain**:
   - Change from testanchor.stellar.org to production anchor
   - Update USDC issuer to mainnet issuer

2. **Add Mainnet Support**:
   - Detect network from wallet
   - Use correct Horizon URL (testnet vs mainnet)
   - Update network passphrase

3. **Enhanced Error Handling**:
   - Better user-facing error messages
   - Retry logic for network failures
   - Token refresh when expired

4. **Status Polling**:
   - Auto-poll every 3 seconds
   - Show progress indicator
   - Alert when completed

5. **Transaction History**:
   - Store withdrawal history
   - Show past transactions
   - Link to Stellar Expert

### Additional Features
- [ ] Auto-refresh status after KYC completion
- [ ] Email notifications when withdrawal completes
- [ ] Support for other assets (not just USDC)
- [ ] Withdrawal limits and KYC tiers
- [ ] Fee estimation before withdrawal
- [ ] Multiple anchor support (user choice)

## Resources

- [SEP-10 Spec](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md)
- [SEP-24 Spec](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md)
- [Stellar Anchor Documentation](https://developers.stellar.org/docs/anchoring-assets/enabling-cross-border-payments/setting-up-test-server)
- [Testnet Anchor](https://testanchor.stellar.org)
- [Stellar Expert](https://stellar.expert/explorer/testnet)

## Verification

All transactions can be verified on-chain:
- Navigate to Stellar Expert
- Search for your public key
- View transaction history
- Check USDC balances

**Example**: https://stellar.expert/explorer/testnet/account/GCKVBXQ2IEO62OV3QIOANZFZSJRZKPJEZ5QJLUBZEV5EQZVPHPQSXUOV
