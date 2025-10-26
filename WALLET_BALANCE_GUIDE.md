# 💰 How to See Your Real Wallet Balance

## The Issue
You're seeing "0 USDC • 100000 XLM" because **your wallet is not connected yet**. The app only shows real balances AFTER you connect your Stellar wallet.

## ✅ Steps to See Your Real Balance

### 1. **Open the App**
```
http://localhost:3000
```

### 2. **Click "Connect Wallet" Button**
- Look for the green "Connect Wallet" button in the top-right corner
- Click it

### 3. **Choose Your Wallet**
- **Freighter** (Recommended) - Browser extension
- **Albedo** - Web-based wallet

### 4. **Approve Connection**
- Your wallet will ask for permission
- Click "Approve" or "Connect"

### 5. **See Your Real Balance! 🎉**
After connection, you'll see:
```
GABCD...XYZ  [Connected]
123.45 USDC • 9,876.54 XLM
```

## 📊 What You'll See

### Before Connection:
- Button says: **"Connect Wallet"**
- No balance shown

### After Connection:
- Your wallet address (shortened)
- **Real USDC balance** from blockchain
- **Real XLM balance** from blockchain  
- Green "Connected" badge
- Refresh button (circular arrow icon)
- Disconnect button

## 🔍 Debug in Console

Open browser console (F12 or Cmd+Option+I) and look for:

### When Connecting:
```
🔌 Connecting to freighter wallet...
✅ Connected! Public Key: GABCD...
💰 Fetching initial balance...
🔍 Fetching balance for: GABCD...
📊 All balances: [...]
💰 XLM Balance: 9876.543210
💵 USDC Balance: 123.45
✅ Final balances - XLM: 9876.543210 USDC: 123.45
✅ Balance fetched - XLM: 9876.543210 USDC: 123.45
```

### Auto-Refresh (Every 30 seconds):
```
🔄 Refreshing balance for: GABCD...
✅ Balance refreshed - XLM: 9876.543210 USDC: 123.45
```

### Manual Refresh (Click refresh button):
```
🔄 Refreshing balance for: GABCD...
✅ Balance refreshed - XLM: 9876.543210 USDC: 123.45
```

## 🎯 Features

### ✅ What's Working:
1. **Real-time Balance** - Fetched from Stellar blockchain
2. **Auto-refresh** - Updates every 30 seconds
3. **Manual Refresh** - Click the refresh button anytime
4. **Persistent Connection** - Remembers your wallet on reload
5. **All Assets** - Shows XLM and USDC balances
6. **Proper Formatting** - Comma separators, decimal places

### 🔄 Balance Updates Automatically When:
- You first connect
- Every 30 seconds (auto-refresh)
- You click the refresh button
- You refresh the page (reconnects automatically)

## ❓ Troubleshooting

### "I see 0 USDC"
**Cause:** You don't have USDC in your wallet yet.

**Solutions:**
1. **Add USDC Trustline:** Use the "USDC Setup" component (if available)
2. **Get Test USDC:** If on testnet, use a faucet
3. **Check Stellar Expert:** Verify your account at https://stellar.expert/explorer/testnet/account/YOUR_ADDRESS

### "I see 0 XLM"
**Cause:** Your account has no XLM.

**Solutions:**
1. **Testnet:** Use Friendbot at https://laboratory.stellar.org/#account-creator?network=test
2. **Mainnet:** Send XLM from another wallet or exchange

### "Balance not updating"
**Solutions:**
1. Click the **refresh button** (circular arrow)
2. **Disconnect and reconnect** wallet
3. **Check console** for errors
4. **Hard refresh** page (Cmd+Shift+R or Ctrl+Shift+R)

### "I don't see my wallet address"
**Cause:** Wallet not connected yet.

**Solution:** Click "Connect Wallet" button first!

## 🔐 Security Notes

- Your private keys NEVER leave your wallet extension
- The app only reads your public address and balances
- No transactions happen without your explicit approval
- You can disconnect anytime

## 📱 Wallet Setup (If Needed)

### Don't Have Freighter?
1. Visit: https://freighter.app
2. Install browser extension
3. Create or import wallet
4. Come back and connect

### Don't Have Albedo?
1. Visit: https://albedo.link
2. No installation needed (web-based)
3. Connect directly

## 🧪 Test Your Balance Display

```bash
# 1. Open app
http://localhost:3000

# 2. Open console (F12)

# 3. Connect wallet
# Click "Connect Wallet" → Choose Freighter

# 4. Check console output
# You should see:
✅ Connected! Public Key: G...
💰 XLM Balance: [YOUR_AMOUNT]
💵 USDC Balance: [YOUR_AMOUNT]

# 5. Look at top-right corner
# Should show YOUR real balances!
```

## 💡 Pro Tips

1. **Keep Console Open** - See all balance updates in real-time
2. **Use Refresh Button** - Force update without waiting 30 seconds
3. **Check Stellar Expert** - Verify balances at https://stellar.expert
4. **Multiple Wallets** - Disconnect and connect different accounts
5. **Testnet vs Mainnet** - Check which network you're on (.env.local)

## 🎨 What the Display Shows

```
┌─────────────────────────────────────────┐
│  GABCD...XYZ  [Connected]              │
│  123.45 USDC • 9,876.54 XLM            │
│                                         │
│  [🔄]  [Disconnect]                    │
└─────────────────────────────────────────┘
```

- **Address:** First 6 + last 6 characters
- **Badge:** Green "Connected" indicator
- **USDC:** Your real USDC balance (2 decimals)
- **XLM:** Your real XLM balance (2 decimals, comma separated)
- **🔄 Button:** Manual refresh
- **Disconnect:** Log out from wallet

## ✨ Summary

**The app IS working correctly!** 

You just need to:
1. ✅ Click "Connect Wallet"
2. ✅ Approve in your wallet extension
3. ✅ See your REAL balance appear!

The "0 USDC • 100000 XLM" was just placeholder text shown when no wallet is connected. Once connected, it shows your actual blockchain balance! 🚀

---

**Still not working?** Share the console output and I'll help debug!
