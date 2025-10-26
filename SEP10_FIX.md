# SEP-10 Authentication Error Fix

## The Problem

**Error Message**: "Wallet type not supported for SEP-10"

### Root Cause
The code was checking for specific `wallet.walletType` values (`'freighter'` or `'albedo'`), but:

1. **Type mismatch**: The wallet type identifier from your wallet context might not exactly match the string `'freighter'`
2. **Incorrect Albedo import**: Tried to import Albedo from `@stellar/freighter-api` which is wrong
3. **Unnecessary complexity**: We don't need to check wallet type - just check if Freighter API exists

## The Solution

**Simplified approach**:
```typescript
// OLD CODE (BUGGY)
if (wallet.walletType === 'freighter' && window.freighterApi) {
  // sign with freighter
} else if (wallet.walletType === 'albedo') {
  // sign with albedo (WRONG IMPORT)
} else {
  throw new Error('Wallet type not supported for SEP-10');
}

// NEW CODE (FIXED)
if (window.freighterApi) {
  try {
    signedXdr = await window.freighterApi.signTransaction(
      challengeData.transaction,
      { networkPassphrase: '...' }
    );
  } catch (e) {
    throw new Error(`Freighter signing failed: ${e.message}`);
  }
} else {
  throw new Error('Please install Freighter wallet extension...');
}
```

## Why This Works

1. **Direct API Check**: We check if `window.freighterApi` exists, not the wallet type string
2. **No Import Issues**: Removed the incorrect Albedo import
3. **Better Error Messages**: Clear error if Freighter isn't available
4. **Simpler Logic**: No need to match wallet type strings

## What Changed

**File**: `app/ramp/page.tsx`

**Function**: `initiateWithdrawal()`

**Section**: Step 2 - Sign challenge with wallet

### Before
- Checked `wallet.walletType === 'freighter'`
- Tried to import and use Albedo (incorrectly)
- Would fail if wallet type didn't match exactly

### After
- Directly checks for `window.freighterApi`
- Works regardless of how wallet type is identified
- Clear error message if Freighter isn't installed

## Testing

1. **Open**: http://localhost:3000/ramp
2. **Ensure**: Freighter extension is installed and unlocked
3. **Ensure**: Wallet is connected (you should see your address in header)
4. **Click**: "🏦 Withdraw to Bank"
5. **Expected**: Freighter popup appears asking to sign the challenge
6. **Sign**: Approve the signature in Freighter
7. **Result**: Should proceed to steps 3 and 4 without error

## Error Messages You Might See

### ✅ Good Errors (Expected)
- **"Please install Freighter wallet extension..."** → Install Freighter
- **"Freighter signing failed: User declined..."** → User rejected signature
- **"Failed to get challenge"** → Network issue with anchor

### ❌ Bad Errors (Need Investigation)
- **"Wallet type not supported for SEP-10"** → This should NOT happen anymore!
- If you still see this, please report it

## Why SEP-10 Needs Direct Signing

SEP-10 authentication requires signing a **challenge transaction** that is:
- **NOT submitted to the network** (just proves you own the keys)
- **Time-sensitive** (expires quickly)
- **Challenge-response pattern** (prevents replay attacks)

Because of this, we need to:
1. Get the raw XDR of the challenge
2. Sign it with the wallet
3. Return the signed XDR (not submit to network)
4. Send signed XDR to anchor to get JWT token

This is different from normal transactions where we use `signAndSubmitTransaction()` which both signs AND submits to the network. For SEP-10, we only want to **sign**, not submit.

## Next Steps

After this fix:
1. ✅ SEP-10 challenge signing should work
2. ✅ You should get a JWT token
3. ✅ Withdrawal should proceed to step 4
4. ✅ KYC popup should open

If you encounter any other errors after this point, they will be in steps 3 or 4 (token exchange or withdrawal initiation), not in the signing step.

---

**Status**: ✅ Fixed - Ready to test!
