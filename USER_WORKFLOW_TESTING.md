# 🧪 User Workflow Testing Guide - Stellar Integration

## Complete End-to-End Testing on Stellar Testnet

This guide walks through all user workflows with checkpoint verification at every step.

---

## 🎯 Testing Environment Setup

### Prerequisites Checklist
- [ ] Freighter wallet extension installed in browser
- [ ] Freighter wallet configured for **Stellar Testnet**
- [ ] Test account funded with XLM (get from https://laboratory.stellar.org/#account-creator)
- [ ] Development server running (`npm run dev`)
- [ ] Browser at http://localhost:3000

### Verify Testnet Configuration
```typescript
// Check in lib/stellar/config.ts
export const STELLAR_CONFIG = {
  network: 'testnet', // ✅ Should be 'testnet' not 'mainnet'
  horizonUrl: 'https://horizon-testnet.stellar.org', // ✅ Testnet URL
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org', // ✅ Testnet URL
  networkPassphrase: Networks.TESTNET, // ✅ Testnet passphrase
}
```

**IMPORTANT**: All transactions will be on **Stellar Testnet** - no real money involved! ✅

---

## 👤 User Role Workflows

### Role 1: Client (Project Poster)
**Goal**: Post a new project with blockchain escrow

### Role 2: Freelancer (Bidder)
**Goal**: Submit on-chain verified bid

### Role 3: Investor (Funder)
**Goal**: Fund project escrow and earn yield

---

## 🚀 WORKFLOW 1: Client Posts a Project

### Step 1: Connect Wallet
**Action**: Click "Connect Wallet" button in top-right navigation

**Expected Behavior**:
1. Freighter popup appears
2. Shows your testnet account address
3. Asks for permission to connect

**Checkpoint Verification**:
```bash
# In browser console (F12):
console.log('Wallet Connected:', wallet.connected) // Should be true
console.log('Public Key:', wallet.publicKey) // Should start with 'G'
console.log('Network:', 'testnet') // Verify testnet
```

**Potential Errors**:
- ❌ "Freighter not installed" → Install Freighter extension
- ❌ "Network mismatch" → Switch Freighter to Testnet
- ❌ "Connection rejected" → Click "Connect" in Freighter popup

**Auto-Correction**:
- Wallet hook will auto-reconnect on page refresh
- Check console for detailed error messages

---

### Step 2: Navigate to "Post Project"
**Action**: Click "Post Project" in navigation

**Expected Behavior**:
1. Redirects to `/post-project` page
2. Form with all fields visible
3. Wallet connection indicator shows connected state

**Checkpoint Verification**:
```bash
# URL should be:
http://localhost:3000/post-project

# Check wallet state persists:
console.log('Wallet still connected:', wallet.connected)
```

**Potential Errors**:
- ❌ "Wallet disconnected" → Reconnect wallet
- ❌ "Page not found" → Check routing in app directory

---

### Step 3: Fill Project Details
**Action**: Fill out the project creation form

**Required Fields**:
- **Title**: "Build Mobile E-commerce App"
- **Category**: Development
- **Description**: Minimum 50 characters required
  ```
  We need an experienced React Native developer to build 
  a cross-platform mobile shopping application with payment 
  integration and real-time order tracking features.
  ```
- **Budget**: 5000 USDC
- **Duration**: 30 days
- **Notes**: Optional additional information

**Checkpoint Verification**:
```bash
# Check character count:
Description length: 175 characters ✅ (>50 required)

# Check budget validation:
Budget: 5000 ✅ (>0 required)

# Check duration:
Duration: 30 days ✅ (>0 required)
```

**Potential Errors**:
- ❌ "Description too short" → Add more detail (min 50 chars)
- ❌ "Budget must be positive" → Enter amount >0
- ❌ "Duration required" → Enter number of days

---

### Step 4: Add Milestones
**Action**: Click "Add Milestone" and create 3 milestones

**Example Milestones**:
```
Milestone 1:
- Title: "UI/UX Design & Wireframes"
- Budget: 1000 USDC
- Description: "Create complete design system and wireframes for all screens"

Milestone 2:
- Title: "Core App Development"
- Budget: 3000 USDC
- Description: "Develop main app functionality, API integration, and user flows"

Milestone 3:
- Title: "Testing & Deployment"
- Budget: 1000 USDC
- Description: "Complete testing, bug fixes, and app store deployment"
```

**Checkpoint Verification**:
```bash
# Milestone validation:
Total milestones: 3 ✅ (1-10 allowed)
Milestone sum: 1000 + 3000 + 1000 = 5000 ✅ (matches total budget)

# Each milestone has:
- Title: ✅ Not empty
- Budget: ✅ > 0
- Description: ✅ Not empty
```

**Potential Errors**:
- ❌ "Milestone budget sum doesn't match total" → Adjust milestone amounts
- ❌ "Too many milestones" → Maximum 10 milestones allowed
- ❌ "No milestones" → Must have at least 1 milestone

**Auto-Correction**:
- Form will prevent submission if validation fails
- Error message will show which milestone needs fixing

---

### Step 5: Check USDC Trustline
**Action**: Click "Publish Project" button

**Expected Behavior - Checkpoint 1/5**:
1. Alert appears: "✅ Checkpoint 1/5: Validating form data..."
2. Form fields become disabled
3. Submit button shows "Validating..."

**Expected Behavior - Checkpoint 2/5**:
If USDC trustline NOT enabled:
1. Alert: "USDC trustline not found"
2. Automatically redirects to USDC setup page
3. Shows "Set Up USDC" button

**Checkpoint Verification**:
```bash
# Check USDC trustline status:
GET https://horizon-testnet.stellar.org/accounts/{YOUR_PUBLIC_KEY}

# Look for balance with asset_code: "USDC"
# If not found → Need to create trustline
```

**Action if Trustline Missing**:
1. Click "Set Up USDC" button
2. Freighter popup appears to authorize trustline transaction
3. Click "Sign" in Freighter
4. Wait for confirmation (2-5 seconds)
5. Alert: "✅ USDC trustline created successfully!"

**Potential Errors**:
- ❌ "Insufficient XLM balance" → Fund account with XLM (need ~2 XLM for trustline)
  - Get testnet XLM: https://laboratory.stellar.org/#account-creator
- ❌ "Transaction failed" → Auto-retry will attempt 3 times
- ❌ "User rejected transaction" → Click "Set Up USDC" again

**Testnet Verification**:
```bash
# After trustline creation, check on Stellar Expert:
https://stellar.expert/explorer/testnet/account/{YOUR_PUBLIC_KEY}

# Should see:
Balance: 0 USDC
Asset: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

---

### Step 6: Create Escrow - Checkpoint 3/5
**Action**: After USDC trustline confirmed, form automatically proceeds

**Expected Behavior**:
1. Alert: "✅ Checkpoint 3/5: Preparing escrow contract..."
2. JavaScript creates escrow parameters:
   ```javascript
   {
     clientAddress: "GXXX...YOUR_ADDRESS",
     freelancerAddress: "GXXX...TBD", // Will be set when bid accepted
     totalBudget: 5000,
     milestones: [...],
     projectId: "auto-generated-uuid",
     currency: "USDC",
     enableYield: false
   }
   ```
3. Calls `validateEscrowCreation()` function
4. If valid, proceeds to signing

**Checkpoint Verification**:
```bash
# Console logs should show:
✅ Checkpoint 3/5: Escrow parameters valid
Client: GXXX...
Budget: 5000 USDC
Milestones: 3
Validation: PASSED
```

**Potential Errors**:
- ❌ "Invalid client address" → Wallet disconnected, reconnect
- ❌ "Budget validation failed" → Check milestone sum matches total
- ❌ "Milestone validation failed" → Check all milestone fields filled

**Auto-Correction**:
- Validation function will show specific error message
- Form won't proceed until validation passes

---

### Step 7: Sign Transaction - Checkpoint 4/5
**Action**: Wait for Freighter wallet popup

**Expected Behavior**:
1. Alert: "✅ Checkpoint 4/5: Please sign the transaction in your wallet..."
2. Freighter popup appears with transaction details:
   - **Operation**: Create Escrow
   - **Network**: Testnet (VERIFY THIS!)
   - **Fee**: ~0.001 XLM
   - **Sequence**: Auto-incremented
3. Transaction preview shows escrow creation

**Checkpoint Verification**:
```bash
# In Freighter popup, verify:
✅ Network: TESTNET (NOT MAINNET!)
✅ Fee: < 1 XLM (reasonable)
✅ Operations: Contract invocation or account creation
✅ Destination: Trustless Work contract address

# CRITICAL: If it says "PUBLIC" network, STOP and switch to testnet!
```

**Action**: Click "Sign" in Freighter popup

**Potential Errors**:
- ❌ "User rejected transaction" → Click "Publish Project" again to retry
- ❌ "Insufficient balance" → Fund account with more XLM
- ❌ "Transaction malformed" → Check console for details, report bug

**Security Check**:
- ⚠️ **ALWAYS verify network is TESTNET before signing!**
- ⚠️ **Never sign if network shows "PUBLIC" (mainnet)**

---

### Step 8: Submit to Blockchain - Checkpoint 5/5
**Action**: After signing, wait for blockchain submission

**Expected Behavior**:
1. Alert: "✅ Checkpoint 5/5: Submitting to Stellar blockchain..."
2. Submit button shows "Submitting..."
3. Auto-retry logic if network issues (max 3 attempts)
4. Wait 3-5 seconds for confirmation

**Checkpoint Verification**:
```bash
# Transaction submitted to Horizon API:
POST https://horizon-testnet.stellar.org/transactions

# Response includes:
{
  "hash": "abc123...", // Transaction hash
  "ledger": 12345678,
  "successful": true
}
```

**Success State**:
1. Alert: "✅ Checkpoint 5/5: Bid Submitted Successfully!"
2. Shows escrow ID: `ESCROW_abc123xyz`
3. Shows transaction hash with link to Stellar Expert
4. After 3 seconds, redirects to project page

**Potential Errors**:
- ❌ "Network timeout" → Auto-retry (attempt 2/3, 3/3)
- ❌ "Transaction failed" → Check console for specific error
- ❌ "Horizon server error" → Wait 10s and retry manually

**Auto-Correction**:
- `executeWithRetry()` will attempt 3 times
- Exponential backoff: 2s → 4s → 8s delays
- Toast notification on each retry

**Testnet Verification**:
```bash
# Click transaction link or manually check:
https://stellar.expert/explorer/testnet/tx/{TRANSACTION_HASH}

# Should show:
✅ Status: Success
✅ Network: Testnet
✅ Ledger: Confirmed
✅ Operations: Escrow creation
✅ Fee: Paid from your account
```

---

### Step 9: Verify Escrow Created
**Action**: View the transaction on Stellar Expert

**Checkpoint Verification**:
1. Click "View on Blockchain" link in success alert
2. Opens Stellar Expert in new tab
3. Verify transaction details:
   ```
   Transaction Hash: abc123...
   Ledger: #12345678
   Date: Just now
   Fee: 0.001 XLM
   Network: TESTNET ✅
   Status: SUCCESS ✅
   
   Operations:
   - Type: Contract Invocation / Account Creation
   - Source: YOUR_PUBLIC_KEY
   - Details: Escrow created with 5000 USDC
   ```

**Additional Verification**:
```bash
# Check Trustless Work API:
GET {TRUSTLESS_WORK_API}/escrows/{ESCROW_ID}

# Expected response:
{
  "escrowId": "ESCROW_abc123xyz",
  "status": "active",
  "clientAddress": "YOUR_ADDRESS",
  "totalBudget": 5000,
  "currency": "USDC",
  "milestones": [...]
}
```

**Potential Issues**:
- ❌ Transaction not found → Wait 5-10 seconds, refresh Stellar Expert
- ❌ Status shows "Failed" → Check error message, likely validation issue
- ❌ Wrong network → If on mainnet, immediately contact support!

---

## 💼 WORKFLOW 2: Freelancer Submits a Bid

### Step 1: Freelancer Connects Wallet
**Action**: Different user connects their Freighter wallet

**Important**: Use a DIFFERENT testnet account than the client

**Checkpoint Verification**:
```bash
# Verify different address:
Freelancer address: GYYY... (different from client GXXX...)
Network: Testnet ✅
Balance: Has XLM for fees
```

---

### Step 2: Browse Projects
**Action**: Navigate to `/browse` or `/project/1`

**Expected Behavior**:
1. See list of projects including newly created one
2. Project shows:
   - Title: "Build Mobile E-commerce App"
   - Budget: 5000 USDC
   - Escrow ID: ESCROW_abc123xyz
   - Status: Active, accepting bids

---

### Step 3: Open Bid Dialog
**Action**: Click "Place a Bid" button on project page

**Expected Behavior**:
1. Dialog opens with bid form
2. If wallet NOT connected:
   - Yellow alert: "Connect your Stellar wallet to submit an on-chain verified bid"
3. If wallet connected:
   - Form fields enabled
   - All inputs ready

**Checkpoint Verification**:
```bash
# Check wallet connection:
console.log('Freelancer wallet:', wallet.publicKey) // GYYY...
console.log('Client wallet (project owner):', projectData.client) // GXXX...
console.log('Different addresses:', wallet.publicKey !== projectData.client) // true ✅
```

---

### Step 4: Fill Bid Form
**Action**: Enter bid details

**Example Bid**:
```
Bid Amount: 4800 USDC (under budget of 5000)
Delivery Time: 25 days (under 30 days)
Proposal: (minimum 50 characters)
  "I'm an experienced React Native developer with 5+ years building 
  e-commerce apps. I've delivered similar projects including payment 
  integrations with Stripe and real-time tracking features. I can 
  complete this within 25 days with high quality code and thorough testing."

Portfolio Link: https://github.com/freelancer-portfolio
Milestone Approach:
  "Week 1: Complete UI/UX designs and get approval
   Weeks 2-3: Build core app features and API integration
   Week 4: Testing, bug fixes, and deployment"
```

**Checkpoint Verification**:
```bash
# Form validation:
Bid amount: 4800 ✅ (>0, <2x budget)
Delivery days: 25 ✅ (1-365)
Proposal length: 250 characters ✅ (>50 required)
Portfolio: Valid URL ✅
```

**Potential Errors**:
- ❌ "Proposal too short" → Add more detail (min 50 chars)
- ❌ "Bid amount exceeds 2x budget" → Reduce amount
- ❌ "Invalid URL" → Check portfolio link format

---

### Step 5: Submit Bid - Checkpoint 1/5
**Action**: Click "Submit Bid" button

**Expected Behavior**:
1. Alert: "✅ Checkpoint 1/5: Wallet Connected"
2. Form fields become disabled
3. Button shows "Validating..."

**Checkpoint Verification**:
```bash
# Console logs:
✅ Checkpoint 1/5: Wallet connection valid
Freelancer: GYYY...
Connected: true
```

---

### Step 6: Validate Bid - Checkpoint 2/5
**Expected Behavior**:
1. Alert: "✅ Checkpoint 2/5: Bid Parameters Valid"
2. JavaScript validates:
   - Bid amount: 4800 ≤ 5000 ✅
   - Delivery time: 25 days > 0 ✅
   - Proposal: 250 chars ≥ 50 ✅
   - Portfolio: Valid URL ✅

**Checkpoint Verification**:
```bash
# Validation results:
{
  valid: true,
  errors: [],
  bidAmount: 4800,
  deliveryDays: 25
}
```

**Potential Errors**:
- ❌ Validation fails → Error alert shows which field is invalid
- ❌ Auto-correction attempts to fix (e.g., trim whitespace)

---

### Step 7: Sign Bid - Checkpoint 3/5
**Action**: Wait for Freighter popup to sign bid message

**Expected Behavior**:
1. Alert: "✅ Checkpoint 3/5: Please sign the bid in your wallet..."
2. Freighter popup appears with message signing request:
   - **Type**: Sign Message (NOT transaction)
   - **Message**: SHA-256 hash of bid data
   - **Network**: Testnet
3. Preview shows bid details hash

**Checkpoint Verification**:
```bash
# Bid proposal data:
{
  escrowId: "ESCROW_abc123xyz",
  freelancerAddress: "GYYY...",
  bidAmount: 4800,
  deliveryDays: 25,
  proposal: "I'm an experienced...",
  timestamp: 1729875600000
}

# Hash created: SHA-256(bidData)
Hash: "def456789abc..." (64 characters hex)
```

**Action**: Click "Sign" in Freighter

**Potential Errors**:
- ❌ "User rejected signature" → Click "Submit Bid" again
- ❌ "Wallet locked" → Unlock Freighter and retry
- ❌ "Signing failed" → Check Freighter is on testnet

**Security Note**:
- ✅ Signing a MESSAGE (not a transaction)
- ✅ No XLM will be spent at this step
- ✅ Creates cryptographic proof of bid authenticity

---

### Step 8: Verify Signature - Checkpoint 4/5
**Expected Behavior**:
1. Alert: "✅ Checkpoint 4/5: Signature Verified"
2. JavaScript verifies signature matches freelancer's public key
3. Confirms hash matches bid data

**Checkpoint Verification**:
```bash
# Signature verification:
Signature: "abc123signature..." (base64)
Signer: GYYY... (freelancer's public key)
Hash match: true ✅
Signature valid: true ✅
```

**Potential Errors**:
- ❌ "Signature verification failed" → Re-sign bid
- ❌ "Hash mismatch" → Bid data was tampered with (security error)

---

### Step 9: Submit to Blockchain - Checkpoint 5/5
**Action**: Signed bid is submitted to Trustless Work API

**Expected Behavior**:
1. Alert: "✅ Checkpoint 5/5: Submitting to blockchain..."
2. Button shows "Submitting..."
3. Auto-retry logic if network issues

**API Call**:
```bash
POST {TRUSTLESS_WORK_API}/bids
Content-Type: application/json

{
  "escrowId": "ESCROW_abc123xyz",
  "freelancerAddress": "GYYY...",
  "bidAmount": 4800,
  "deliveryDays": 25,
  "proposal": "I'm an experienced...",
  "signature": "abc123signature...",
  "hash": "def456789abc...",
  "timestamp": 1729875600000
}
```

**Success Response**:
```json
{
  "success": true,
  "bidId": "BID_xyz789",
  "transactionHash": "ghi012345...",
  "verified": true
}
```

**Checkpoint Verification**:
```bash
# Success alert appears:
✅ Checkpoint 5/5: Bid Submitted Successfully!
Your bid is now verified on-chain

# Transaction hash link:
https://stellar.expert/explorer/testnet/tx/ghi012345...
```

**Potential Errors**:
- ❌ "Network timeout" → Auto-retry (attempt 2/3, 3/3)
- ❌ "API error" → Check console, report if persists
- ❌ "Duplicate bid" → You already bid on this project

**Auto-Correction**:
- Retries 3 times with exponential backoff
- Toast notification on each retry

---

### Step 10: Verify Bid on Blockchain
**Action**: Click "View on Blockchain" link

**Checkpoint Verification**:
```bash
# On Stellar Expert:
https://stellar.expert/explorer/testnet/tx/ghi012345...

Transaction Details:
✅ Network: Testnet
✅ Status: Success
✅ Operations: Message signature + bid registration
✅ Source: GYYY... (freelancer)
✅ Fee: ~0.0001 XLM

# In project UI:
Bid appears with "✅ Verified On-Chain" badge
```

---

## 💰 WORKFLOW 3: Investor Funds the Project

### Step 1: Investor Connects Wallet
**Action**: Third user connects their wallet

**Checkpoint Verification**:
```bash
Investor address: GZZZ... (different from client & freelancer)
Network: Testnet ✅
USDC balance: >0 (needs USDC to fund)
```

---

### Step 2: Set Up USDC (if needed)
**Action**: If investor doesn't have USDC trustline, create it

**Steps**:
1. Navigate to project page
2. Click "Fund Project" button
3. If no USDC trustline, redirected to setup
4. Click "Set Up USDC"
5. Sign trustline transaction
6. Confirm: "✅ USDC trustline created"

---

### Step 3: Get Testnet USDC
**Action**: Since this is testnet, you need test USDC

**Option 1: Use Stellar Laboratory**
```bash
# Go to: https://laboratory.stellar.org/#txbuilder

1. Set Network to "Testnet"
2. Source Account: Asset issuer (Circle's testnet issuer)
3. Operation Type: Payment
4. Destination: GZZZ... (investor address)
5. Asset: USDC
6. Amount: 10000 (test amount)
7. Sign and submit
```

**Option 2: Request from Faucet** (if available)
```bash
# Some USDC testnet faucets:
https://testnet-usdc-faucet.stellar.org (if exists)
```

**Checkpoint Verification**:
```bash
# Check balance on Stellar Expert:
https://stellar.expert/explorer/testnet/account/GZZZ...

Should show:
USDC Balance: 10000 USDC ✅
```

---

### Step 4: Fund Escrow
**Action**: Click "Fund Project" button on project page

**Expected Behavior**:
1. Dialog opens with funding options
2. Shows:
   - Project needs: 5000 USDC
   - Current funded: 0 USDC
   - Your balance: 10000 USDC
3. Enter amount to fund: 5000 USDC
4. Optional: Enable yield-earning checkbox

**Checkpoint Verification**:
```bash
# Funding parameters:
Amount: 5000 USDC ✅ (matches project budget)
Investor: GZZZ...
Escrow ID: ESCROW_abc123xyz
Enable yield: true (optional)
```

---

### Step 5: Sign Funding Transaction
**Action**: Freighter popup appears

**Expected Behavior**:
1. Transaction shows:
   - **Operation**: Payment to escrow
   - **Amount**: 5000 USDC
   - **Destination**: Escrow contract address
   - **Network**: TESTNET ✅
2. Click "Sign" in Freighter

**Checkpoint Verification**:
```bash
# CRITICAL CHECKS:
✅ Network: TESTNET (not mainnet!)
✅ Amount: 5000 USDC (correct)
✅ Asset: USDC (not XLM)
✅ Destination: Valid escrow address
✅ Fee: < 1 XLM

# If any check fails, REJECT transaction!
```

---

### Step 6: Verify Funding
**Action**: Wait for transaction confirmation

**Expected Behavior**:
1. Success toast: "✅ Project funded successfully!"
2. Project page updates:
   - Funded: 5000 USDC (100%)
   - Investor contribution: Your address listed
   - Status: Fully funded

**Checkpoint Verification**:
```bash
# Check transaction on Stellar Expert:
https://stellar.expert/explorer/testnet/tx/{TX_HASH}

✅ Payment operation: 5000 USDC
✅ From: GZZZ... (investor)
✅ To: Escrow contract
✅ Status: Success

# Check escrow status:
GET {TRUSTLESS_WORK_API}/escrows/ESCROW_abc123xyz

Response:
{
  "totalFunded": 5000,
  "status": "funded",
  "investors": ["GZZZ..."]
}
```

---

## 🔍 Complete Testing Checklist

### Before Testing
- [ ] Freighter installed and configured for TESTNET
- [ ] At least 3 test accounts with XLM balance
- [ ] Development server running (`npm run dev`)
- [ ] Browser console open (F12) for monitoring

### Client Workflow
- [ ] Connect wallet (testnet)
- [ ] Navigate to Post Project
- [ ] Fill all required fields
- [ ] Add 3 milestones (sum = total budget)
- [ ] Set up USDC trustline (if needed)
- [ ] Create escrow with 5 checkpoints
- [ ] Verify transaction on Stellar Expert (TESTNET)
- [ ] Confirm escrow ID received

### Freelancer Workflow
- [ ] Connect different wallet (testnet)
- [ ] Browse to project
- [ ] Fill bid form (>50 char proposal)
- [ ] Sign bid message in wallet
- [ ] Submit with 5 checkpoints
- [ ] Verify signature on blockchain (TESTNET)
- [ ] Confirm "Verified On-Chain" badge shows

### Investor Workflow
- [ ] Connect third wallet (testnet)
- [ ] Set up USDC trustline (if needed)
- [ ] Get test USDC from faucet/laboratory
- [ ] Navigate to funded project
- [ ] Click "Fund Project"
- [ ] Enter funding amount
- [ ] Sign payment transaction (TESTNET)
- [ ] Verify payment on Stellar Expert

### Error Testing
- [ ] Try submitting without wallet connected
- [ ] Try bid with <50 char proposal
- [ ] Try milestone sum ≠ total budget
- [ ] Try funding without USDC
- [ ] Reject wallet signature (test retry)
- [ ] Test with no XLM balance (fee error)

### Network Verification (CRITICAL!)
- [ ] All config files point to testnet
- [ ] All Freighter popups show "TESTNET"
- [ ] All Stellar Expert links use `/testnet/`
- [ ] No mainnet transactions attempted

---

## 🚨 Error Scenarios & Solutions

### Error: "Wallet Not Connected"
**Cause**: User didn't connect Freighter
**Solution**: Click "Connect Wallet" button
**Auto-Correction**: Alert prompts user to connect

### Error: "Insufficient XLM Balance"
**Cause**: Account doesn't have enough XLM for fees
**Solution**: Fund account at https://laboratory.stellar.org/#account-creator
**Prevention**: Need ~2-5 XLM for multiple transactions

### Error: "USDC Trustline Not Found"
**Cause**: Account hasn't enabled USDC
**Solution**: App auto-redirects to USDC setup page
**Auto-Correction**: One-click "Set Up USDC" button

### Error: "Description Too Short"
**Cause**: Less than 50 characters
**Solution**: Add more detail to description/proposal
**Auto-Correction**: Character counter shows progress

### Error: "Milestone Budget Mismatch"
**Cause**: Sum of milestones ≠ total budget
**Solution**: Adjust milestone amounts
**Auto-Correction**: Error message shows expected vs actual sum

### Error: "Transaction Failed"
**Cause**: Network issue or validation error
**Solution**: Automatic retry (3 attempts)
**Auto-Correction**: Exponential backoff, toast notifications

### Error: "Network Mismatch"
**Cause**: Freighter on mainnet, app on testnet
**Solution**: Switch Freighter to testnet network
**Prevention**: Always verify network before signing!

---

## 📊 Expected Test Results

### Successful Flow Outcomes
1. **Project Created**:
   - ✅ Escrow ID generated
   - ✅ Transaction on testnet blockchain
   - ✅ Viewable on Stellar Expert
   - ✅ No real money spent

2. **Bid Submitted**:
   - ✅ Cryptographic signature created
   - ✅ Bid registered on-chain
   - ✅ "Verified" badge displayed
   - ✅ Tamper-proof bid record

3. **Project Funded**:
   - ✅ USDC transferred to escrow
   - ✅ Investor balance decreased
   - ✅ Escrow balance increased
   - ✅ All on testnet

### Console Logs to Expect
```bash
# Client creates project:
✅ Checkpoint 1/5: Wallet Connected
✅ Checkpoint 2/5: Form Data Valid
✅ Checkpoint 3/5: Escrow Parameters Valid
✅ Checkpoint 4/5: Transaction Signed
✅ Checkpoint 5/5: Submitted to Blockchain
Escrow ID: ESCROW_abc123xyz
Transaction: https://stellar.expert/explorer/testnet/tx/...

# Freelancer bids:
✅ Checkpoint 1/5: Wallet Connected
✅ Checkpoint 2/5: Bid Parameters Valid
✅ Checkpoint 3/5: Bid Signed
✅ Checkpoint 4/5: Signature Verified
✅ Checkpoint 5/5: Submitted to Blockchain
Bid ID: BID_xyz789

# Investor funds:
✅ USDC Payment: 5000 USDC
✅ Transaction Confirmed
✅ Escrow Funded: 100%
```

---

## 🔗 Useful Testing Links

### Stellar Testnet Resources
- **Account Creator**: https://laboratory.stellar.org/#account-creator
- **Transaction Builder**: https://laboratory.stellar.org/#txbuilder
- **Stellar Expert**: https://stellar.expert/explorer/testnet
- **Horizon API**: https://horizon-testnet.stellar.org

### Freighter Wallet
- **Install**: https://www.freighter.app/
- **Switch Network**: Settings → Network → Testnet
- **Import Account**: Settings → Import → Paste secret key

### Debugging Tools
- **Browser Console**: F12 → Console tab
- **Network Tab**: F12 → Network tab (see API calls)
- **React DevTools**: Check wallet state, component props

---

## ✅ Final Verification

After completing all workflows, verify:

```bash
# All transactions on TESTNET:
https://stellar.expert/explorer/testnet/account/GXXX... (client)
https://stellar.expert/explorer/testnet/account/GYYY... (freelancer)
https://stellar.expert/explorer/testnet/account/GZZZ... (investor)

# Should show:
✅ Multiple transactions
✅ All on testnet network
✅ Escrow operations visible
✅ USDC payments recorded
✅ All signatures verified

# Zero mainnet transactions!
```

**If any transaction appears on mainnet, immediately stop testing and review configuration!**

---

## 📝 Notes

- This is **TESTNET** - all transactions use test tokens with no real value
- Test XLM can be obtained free from Stellar Laboratory
- Test USDC may need to be issued manually via Laboratory
- All signatures are cryptographically secure even on testnet
- The checkpoint system will auto-retry on failures
- Every operation is logged to console for debugging

**Happy Testing!** 🎉
