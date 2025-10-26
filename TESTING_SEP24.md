# Testing SEP-24 Withdrawal Flow

## Quick Start Guide

### 1. Start Development Server
```bash
npm run dev
```

### 2. Connect Wallet
- Open http://localhost:3000
- Click "Connect Wallet" in header
- Approve connection in Freighter/Albedo

### 3. Get USDC
Navigate to `/ramp` page and:

**Option A: Swap XLM → USDC**
- You should have ~20,000 XLM from Friendbot
- Scroll to "Swap XLM to USDC" section
- Enter amount (e.g., 100 XLM)
- Click "Swap XLM to USDC"
- Approve transaction in wallet
- Wait for confirmation

**Option B: Add Trustline & Request USDC**
- Click "Add USDC Trustline" if you don't have it
- Use Stellar Laboratory to send USDC to your account

### 4. Initiate Withdrawal
In the "SEP-24 Withdrawal" section:

1. **Enter Amount**: 
   - Type withdrawal amount (e.g., `10`)
   - Must be ≤ your USDC balance

2. **Click "Withdraw to Bank"**:
   - Status updates to "Step 1/4: Requesting authentication challenge..."
   - Then "Step 2/4: Please sign the authentication challenge in your wallet..."

3. **Sign Challenge in Wallet**:
   - Freighter/Albedo popup appears
   - Click "Approve" to sign the SEP-10 challenge
   - ⚠️ This is NOT signing a payment - just authentication

4. **Wait for Authentication**:
   - "Step 3/4: Getting authentication token..."
   - "Step 4/4: Initiating withdrawal..."

5. **Complete KYC Form**:
   - Popup window opens with anchor's form
   - Fill out the withdrawal information
   - Submit the form

6. **Monitor Status**:
   - Transaction ID is displayed
   - Click "Check Status" to poll progress
   - Status transitions: incomplete → pending → completed

## Expected Console Output

### Step 1: Challenge Request
```
POST /api/sep10/challenge?account=GCKVBX...
Status: 200
Response: { success: true, transaction: "AAAAAgAAAAB...", network_passphrase: "Test SDF Network ; September 2015" }
```

### Step 2: Wallet Signing
```
Freighter signing challenge...
Signed XDR: AAAAAgAAAAB...
```

### Step 3: Token Exchange
```
POST /api/sep10/token
Body: { signedTransaction: "AAAAAgAAAAB..." }
Status: 200
Response: { success: true, token: "eyJhbGciOi..." }
```

### Step 4: Withdrawal Initiation
```
POST /api/sep24/withdraw
Body: { asset_code: "USDC", account: "GCKVBX...", amount: "10", token: "eyJ..." }
Status: 200
Response: { success: true, url: "https://testanchor.stellar.org/sep24/...", id: "abc123" }
```

### Step 5: Status Polling
```
GET /api/sep24/transaction?id=abc123
Headers: { Authorization: "Bearer eyJ..." }
Status: 200
Response: { success: true, transaction: { status: "incomplete", ... } }
```

## Troubleshooting

### Popup Blocked
**Issue**: KYC popup doesn't open

**Solution**:
- Check browser's popup blocker
- Allow popups for localhost:3000
- Manually click the withdrawal URL displayed

### Authentication Failed
**Issue**: "Failed to get token" error

**Cause**: Challenge signature invalid or expired

**Solution**:
- Retry the withdrawal
- Ensure wallet is unlocked
- Check network passphrase matches testnet

### Insufficient Balance
**Issue**: Can't withdraw desired amount

**Solution**:
- Check USDC balance in UI
- Swap more XLM → USDC
- Try smaller withdrawal amount

### Transaction Stuck
**Issue**: Status remains "incomplete"

**Solution**:
- Complete KYC form in popup
- Check if popup was closed prematurely
- Reopen withdrawal URL manually

## Verification

### 1. Check JWT Token
```javascript
// In browser console
localStorage.getItem('sep10_jwt')
```

### 2. Decode JWT (optional)
```javascript
// In browser console
const token = 'eyJhbGciOi...';
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
```

### 3. Verify Transaction On-Chain
1. Copy transaction ID from UI
2. Check Stellar Expert:
   ```
   https://stellar.expert/explorer/testnet/tx/{TRANSACTION_ID}
   ```

### 4. Check Account Balance
```
https://stellar.expert/explorer/testnet/account/{YOUR_PUBLIC_KEY}
```

## Test Scenarios

### ✅ Happy Path
1. Connect wallet
2. Get USDC (via swap or transfer)
3. Initiate withdrawal
4. Sign challenge
5. Complete KYC
6. Poll status until completed

### ⚠️ Error Cases

**Test 1: Withdraw without USDC**
- Expected: Button disabled
- Actual: "SEP-24 Withdrawal" card not visible

**Test 2: Withdraw with disconnected wallet**
- Expected: "Wallet not connected" error
- Actual: Error toast appears

**Test 3: Sign challenge with wrong wallet**
- Expected: "Failed to get token" error
- Actual: Authentication fails

**Test 4: Close popup before completing KYC**
- Expected: Status remains "incomplete"
- Actual: Can reopen URL or restart withdrawal

## API Route Testing

### Test Challenge Endpoint
```bash
curl "http://localhost:3000/api/sep10/challenge?account=GCKVBXQ2IEO62OV3QIOANZFZSJRZKPJEZ5QJLUBZEV5EQZVPHPQSXUOV"
```

Expected:
```json
{
  "success": true,
  "transaction": "AAAAAgAAAAB...",
  "network_passphrase": "Test SDF Network ; September 2015"
}
```

### Test Info Endpoint
```bash
curl "http://localhost:3000/api/sep24/info"
```

Expected:
```json
{
  "success": true,
  "withdraw": {
    "USDC": {
      "enabled": true,
      "min_amount": 0.1,
      "max_amount": 1000000
    }
  }
}
```

## Performance Metrics

### Expected Timings
- Challenge request: ~200ms
- Wallet signing: 2-5s (user interaction)
- Token exchange: ~300ms
- Withdrawal initiation: ~500ms
- Status polling: ~200ms per request

### Total Flow Duration
- **Fast**: ~10 seconds (if user signs quickly)
- **Typical**: 30-60 seconds (including KYC form)
- **Slow**: 2-5 minutes (detailed KYC information)

## Screenshots (What to Expect)

### Before Withdrawal
```
┌────────────────────────────────────┐
│ 💸 SEP-24 Withdrawal               │
│ Withdraw USDC to your bank account │
├────────────────────────────────────┤
│ Amount (USDC)                      │
│ [10                    ]           │
│ Available: 118.83 USDC             │
│                                    │
│ [ 🏦 Withdraw to Bank ]           │
│                                    │
│ ℹ️ This will authenticate via      │
│ SEP-10, initiate a SEP-24          │
│ withdrawal, and open a KYC popup.  │
└────────────────────────────────────┘
```

### During Withdrawal
```
┌────────────────────────────────────┐
│ ✅ Withdrawal in progress           │
│ Transaction ID: abc123             │
│ Open KYC Form ↗                    │
├────────────────────────────────────┤
│ [Processing...] [Check Status]     │
└────────────────────────────────────┘
```

## Next Steps After Testing

1. **Document Issues**: Note any errors encountered
2. **Check Logs**: Review browser console and server logs
3. **Verify Transactions**: Check Stellar Expert for all operations
4. **Test Edge Cases**: Try invalid amounts, expired tokens, etc.
5. **Performance**: Monitor API response times

## Need Help?

### Logs to Check
1. **Browser Console**: Press F12 → Console tab
2. **Server Logs**: Terminal running `npm run dev`
3. **Network Tab**: F12 → Network → Filter by API

### Common Issues
- **CORS errors**: Anchor may block localhost (use proxy)
- **Network mismatch**: Ensure testnet everywhere
- **Token expiration**: JWT tokens expire after ~15 minutes
- **Popup blocked**: Check browser settings

### Debug Mode
Enable verbose logging by adding to your code:
```typescript
console.log('Step:', stepNumber);
console.log('Token:', jwtToken?.substring(0, 20) + '...');
console.log('Transaction ID:', transactionId);
```

---

**Happy Testing! 🚀**

Questions? Check `SEP24_IMPLEMENTATION.md` for architecture details.
