import * as StellarSDK from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
const USER_PUBLIC_KEY = process.env.USER_PUBLIC_KEY;
const USDC_ISSUER = process.env.USDC_ISSUER_TESTNET;

// Amount to swap (default 100 XLM if not provided)
const XLM_AMOUNT = process.env.SWAP_AMOUNT || '100';

interface SwapResult {
  success: boolean;
  txHash?: string;
  sourceAmount?: string;
  destAmount?: string;
  error?: string;
}

async function swapXLMtoUSDC(): Promise<SwapResult> {
  console.log('\n💱 CHECKPOINT 4: XLM → USDC Swap via DEX');
  console.log('='.repeat(70));

  if (!USER_PUBLIC_KEY) {
    return { 
      success: false, 
      error: 'USER_PUBLIC_KEY not found in .env' 
    };
  }

  if (!USDC_ISSUER) {
    return { 
      success: false, 
      error: 'USDC_ISSUER_TESTNET not found in .env' 
    };
  }

  const server = new StellarSDK.Horizon.Server(HORIZON_URL);

  try {
    console.log('📍 User Account:', USER_PUBLIC_KEY);
    console.log('💰 Swap Amount:', XLM_AMOUNT, 'XLM');
    console.log('🎯 Target Asset: USDC');
    console.log('🏦 Issuer:', USDC_ISSUER);

    // Step 1: Load account to get balances
    console.log('\n🔍 Step 1: Loading account...');
    const account = await server.loadAccount(USER_PUBLIC_KEY);
    
    const xlmBalance = account.balances.find(b => b.asset_type === 'native');
    const usdcBalance = account.balances.find(
      b => b.asset_type !== 'native' && 
           (b as any).asset_code === 'USDC' && 
           (b as any).asset_issuer === USDC_ISSUER
    );

    console.log('   Current XLM:', xlmBalance ? (xlmBalance as any).balance : '0');
    console.log('   Current USDC:', usdcBalance ? (usdcBalance as any).balance : '0');

    if (!xlmBalance || parseFloat((xlmBalance as any).balance) < parseFloat(XLM_AMOUNT)) {
      return {
        success: false,
        error: `Insufficient XLM balance. Need ${XLM_AMOUNT}, have ${xlmBalance ? (xlmBalance as any).balance : '0'}`
      };
    }

    if (!usdcBalance) {
      return {
        success: false,
        error: 'USDC trustline not found. Please add trustline first.'
      };
    }

    // Step 2: Find path for swap
    console.log('\n🔍 Step 2: Finding best swap path...');
    
    const sourceAsset = StellarSDK.Asset.native();
    const destAsset = new StellarSDK.Asset('USDC', USDC_ISSUER);

    const pathsResponse = await server
      .strictSendPaths(sourceAsset, XLM_AMOUNT, [destAsset])
      .call();

    if (!pathsResponse.records || pathsResponse.records.length === 0) {
      return {
        success: false,
        error: 'No swap path found. The DEX might not have liquidity for XLM→USDC.'
      };
    }

    const bestPath = pathsResponse.records[0];
    console.log('   ✅ Path found!');
    console.log('   Source Amount:', bestPath.source_amount, 'XLM');
    console.log('   Dest Amount:', bestPath.destination_amount, 'USDC');
    console.log('   Path:', bestPath.path.map((p: any) => 
      p.asset_type === 'native' ? 'XLM' : `${p.asset_code}`
    ).join(' → ') || 'Direct');

    // ⚠️ CRITICAL: This requires signing with secret key
    // Since we don't have the secret key in environment, we'll show instructions
    console.log('\n⚠️  SWAP TRANSACTION READY - REQUIRES SIGNING');
    console.log('='.repeat(70));
    console.log('\n📋 To complete the swap, you have 2 options:\n');
    
    console.log('Option 1: Add SECRET_KEY to .env and re-run');
    console.log('   1. Add this line to .env: SECRET_KEY=your_secret_key_here');
    console.log('   2. Re-run: npm run swap\n');

    console.log('Option 2: Manual swap via Stellar Laboratory');
    console.log('   1. Go to: https://laboratory.stellar.org/#txbuilder?network=test');
    console.log('   2. Source Account:', USER_PUBLIC_KEY);
    console.log('   3. Add Operation: "Path Payment Strict Send"');
    console.log('   4. Send Asset: XLM (native)');
    console.log('   5. Send Amount:', bestPath.source_amount);
    console.log('   6. Destination:', USER_PUBLIC_KEY);
    console.log('   7. Destination Asset: USDC');
    console.log('   8. Destination Issuer:', USDC_ISSUER);
    console.log('   9. Min Destination Amount:', bestPath.destination_amount);
    console.log('   10. Sign with Freighter and submit\n');

    console.log('Option 3: Use Freighter API (Recommended for UI)');
    console.log('   This will be implemented in the Next.js UI.\n');

    console.log('='.repeat(70));
    console.log('ℹ️  For now, CHECKPOINT 4 is PARTIALLY COMPLETE');
    console.log('   Path validated ✅, but transaction requires signing.');
    console.log('='.repeat(70));

    return {
      success: true,
      sourceAmount: bestPath.source_amount,
      destAmount: bestPath.destination_amount,
      txHash: undefined // Will be set after signing
    };

  } catch (error: any) {
    console.error('\n❌ Error during swap:', error.message);
    
    // Auto-diagnosis
    console.log('\n🔧 Auto-Diagnosis:');
    if (error.message.includes('Account not found')) {
      console.log('   • Account does not exist or is not funded');
      console.log('   • Fund via Friendbot: https://friendbot.stellar.org?addr=' + USER_PUBLIC_KEY);
    } else if (error.message.includes('trustline')) {
      console.log('   • USDC trustline missing');
      console.log('   • Add trustline via Freighter wallet');
    } else if (error.message.includes('path')) {
      console.log('   • No liquidity on DEX for this swap');
      console.log('   • Try using stellarterm.com to add liquidity');
    } else {
      console.log('   • Check Horizon status:', HORIZON_URL);
      console.log('   • Verify network connectivity');
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Execute if run directly
if (require.main === module) {
  swapXLMtoUSDC()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Swap path validated successfully!');
        if (result.txHash) {
          console.log('🔗 Transaction:', `https://stellar.expert/explorer/testnet/tx/${result.txHash}`);
        }
        process.exit(0);
      } else {
        console.error('\n❌ Swap failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

export { swapXLMtoUSDC };
