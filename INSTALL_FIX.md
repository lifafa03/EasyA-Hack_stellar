# 🔧 Quick Fix: Installation Errors

## Current Issue

The app is showing errors because the Stellar SDK packages aren't installed yet. The code references `@stellar/stellar-sdk` and `@stellar/freighter-api` but they're not in `node_modules`.

---

## ✅ SOLUTION: Install Dependencies

### Option 1: Run the Install Script (Recommended)

```bash
cd /Users/solipuram.rohanreddy/Desktop/EasyA-Hack_stellar
./install.sh
```

This will:
- Check if Node.js is installed
- Install all dependencies
- Verify Stellar packages
- Show next steps

### Option 2: Manual Installation

```bash
cd /Users/solipuram.rohanreddy/Desktop/EasyA-Hack_stellar
npm install
```

---

## What Gets Installed

When you run `npm install`, these packages will be installed:

✅ **Stellar Integration:**
- `@stellar/stellar-sdk@13.2.0` - Stellar blockchain SDK
- `@stellar/freighter-api@2.1.0` - Wallet connectivity
- `axios@1.7.9` - HTTP client
- `bignumber.js@9.1.2` - Precision math

✅ **All Other Dependencies:** (Next.js, React, UI components, etc.)

---

## After Installation

1. **Verify installation:**
   ```bash
   ls node_modules/@stellar/
   # Should show: freighter-api/ stellar-sdk/
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Check for errors:**
   - Open http://localhost:3000 (or 3001 if 3000 is busy)
   - Look for "Connect Wallet" button in navigation
   - No compilation errors should appear

---

## Why This Happened

The code I created references Stellar SDK packages that need to be installed:

```typescript
// This line requires @stellar/stellar-sdk to be installed
import * as StellarSdk from '@stellar/stellar-sdk';

// This line requires @stellar/freighter-api
import { isConnected, getPublicKey } from '@stellar/freighter-api';
```

Until you run `npm install`, these modules don't exist in `node_modules`, causing the error.

---

## Temporary Workaround (If You Can't Install Yet)

If you need the app to run without installing Stellar packages:

### Step 1: Comment out Stellar imports temporarily

Edit `/Users/solipuram.rohanreddy/Desktop/EasyA-Hack_stellar/hooks/use-wallet.tsx`:

Change line 10 from:
```typescript
import { WalletType, WalletState, connectWallet, getAccountBalance, disconnectWallet, checkWalletConnection } from '@/lib/stellar/wallet.mock';
```

To just import types:
```typescript
export type WalletType = 'freighter' | 'albedo' | 'rabet';
export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  balance: string | null;
  usdcBalance: string | null;
}
// Mock functions
const connectWallet = async (type: WalletType) => { throw new Error('Install dependencies first'); };
const getAccountBalance = async (key: string) => ({ xlm: '0', usdc: '0' });
const disconnectWallet = () => {};
const checkWalletConnection = async () => false;
```

### Step 2: Remove WalletProvider from layout temporarily

Edit `app/layout.tsx` - comment out lines 27-29:
```tsx
{/* <WalletProvider> */}
  <Navigation />
  {children}
{/* </WalletProvider> */}
```

### Step 3: Hide wallet button

Edit `components/navigation.tsx` - comment out line 32:
```tsx
{/* <WalletConnectButton /> */}
```

**BUT THIS IS NOT RECOMMENDED!** Just install the dependencies properly.

---

## Expected Result After Installation

✅ No compile errors
✅ Dev server runs on port 3000 or 3001
✅ "Connect Wallet" button appears in navigation
✅ Console shows: `⚠️ MOCK MODE` warning (until you connect real wallet)

---

## Next Steps After Successful Install

1. ✅ Install Freighter wallet: https://freighter.app
2. ✅ Switch Freighter to Testnet
3. ✅ Fund account: https://laboratory.stellar.org/#account-creator
4. ✅ Click "Connect Wallet" in your app
5. ✅ See your address and balance!

---

## Still Having Issues?

### Error: "Cannot find module 'X'"
**Solution:** Make sure you ran `npm install` successfully

### Error: "Port 3000 in use"
**Solution:** App will use port 3001 automatically, or kill the process using 3000

### Error: "Next.js inferred your workspace root"
**Solution:** This is just a warning, can be ignored. Or set `turbopack.root` in `next.config.mjs`

### TypeScript errors in editor
**Solution:** These should disappear after `npm install`. Restart your editor if needed.

---

**Just run `npm install` and everything will work! 🚀**
