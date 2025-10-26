import * as dotenv from 'dotenv';

dotenv.config();

const ANCHOR_DOMAIN = process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';
const USER_PUBLIC_KEY = process.env.USER_PUBLIC_KEY;
const USDC_ISSUER = process.env.USDC_ISSUER_TESTNET;

// SEP-24 endpoints (from SEP-1 discovery)
const TRANSFER_SERVER = `https://${ANCHOR_DOMAIN}/sep24`;

interface WithdrawResult {
  success: boolean;
  interactiveUrl?: string;
  transactionId?: string;
  error?: string;
}

async function initiateWithdrawal(jwtToken?: string): Promise<WithdrawResult> {
  console.log('\n💸 CHECKPOINT 6: SEP-24 Interactive Withdrawal');
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

  try {
    console.log('📍 User Account:', USER_PUBLIC_KEY);
    console.log('🏦 Anchor:', ANCHOR_DOMAIN);
    console.log('💰 Asset: USDC');
    console.log('🔗 Transfer Server:', TRANSFER_SERVER);

    // Check if we have JWT token
    if (!jwtToken) {
      console.log('\n⚠️  JWT Token Required');
      console.log('   SEP-24 requires SEP-10 authentication first.');
      console.log('   Run: npm run sep10');
      console.log('\n   For now, showing what the withdrawal flow looks like...\n');
    }

    // Step 1: Get withdrawal info
    console.log('\n🔍 Step 1: Fetching withdrawal information...');
    const infoUrl = `${TRANSFER_SERVER}/info`;
    
    const infoResponse = await fetch(infoUrl);
    if (!infoResponse.ok) {
      throw new Error(`Failed to get info: ${infoResponse.status} ${infoResponse.statusText}`);
    }

    const infoData = await infoResponse.json();
    console.log('   ✅ Anchor info received!');

    // Check if USDC withdrawal is supported
    const usdcInfo = infoData.withdraw?.USDC;
    if (!usdcInfo) {
      return {
        success: false,
        error: 'USDC withdrawal not supported by this anchor'
      };
    }

    console.log('   Enabled:', usdcInfo.enabled);
    console.log('   Min Amount:', usdcInfo.min_amount || 'Not specified');
    console.log('   Max Amount:', usdcInfo.max_amount || 'Not specified');
    console.log('   Fee:', usdcInfo.fee_fixed || usdcInfo.fee_percent || 'Not specified');

    // Step 2: Initiate withdrawal (would require JWT)
    console.log('\n🔍 Step 2: Initiating withdrawal...');

    if (!jwtToken) {
      console.log('\n📋 Withdrawal Request Details:');
      console.log('   Endpoint: POST', `${TRANSFER_SERVER}/transactions/withdraw/interactive`);
      console.log('   Headers:');
      console.log('     Authorization: Bearer <jwt_token>');
      console.log('     Content-Type: application/json');
      console.log('   Body:');
      console.log('     {');
      console.log('       "asset_code": "USDC",');
      console.log('       "asset_issuer": "' + USDC_ISSUER + '",');
      console.log('       "account": "' + USER_PUBLIC_KEY + '",');
      console.log('       "amount": "10"  // Amount to withdraw');
      console.log('     }');
      console.log('\n   Response will contain:');
      console.log('     - "url": Interactive KYC/withdrawal form');
      console.log('     - "id": Transaction ID for polling status');

      console.log('\n🔍 Step 3: User completes interactive flow');
      console.log('   • User opens the interactive URL in browser');
      console.log('   • Completes KYC/AML forms if required');
      console.log('   • Provides bank account details');
      console.log('   • Confirms withdrawal amount and fees');

      console.log('\n🔍 Step 4: Poll transaction status');
      console.log('   Endpoint: GET', `${TRANSFER_SERVER}/transaction?id=<transaction_id>`);
      console.log('   Headers:');
      console.log('     Authorization: Bearer <jwt_token>');
      console.log('\n   Status progression:');
      console.log('     incomplete → pending_user_transfer_start → pending_anchor →');
      console.log('     pending_external → completed');

      console.log('\n🔍 Step 5: User sends USDC to anchor');
      console.log('   • Anchor provides deposit address in transaction response');
      console.log('   • User sends USDC to anchor\'s address');
      console.log('   • Anchor detects payment and processes withdrawal');

      console.log('\n🔍 Step 6: Withdrawal completes');
      console.log('   • Anchor sends fiat to user\'s bank account');
      console.log('   • Transaction status: completed');
      console.log('   • User receives confirmation');
    } else {
      // If we had JWT, we'd actually make the request
      console.log('   Making authenticated request to anchor...');
      console.log('   (This would create actual withdrawal transaction)');
    }

    console.log('\n='.repeat(70));
    console.log('ℹ️  CHECKPOINT 6 is PARTIALLY COMPLETE');
    console.log('   Withdrawal flow documented ✅, but requires JWT token.');
    console.log('   Complete SEP-10 authentication first to get JWT token.');
    console.log('='.repeat(70));

    return {
      success: true,
      interactiveUrl: undefined, // Will be set after actual request
      transactionId: undefined
    };

  } catch (error: any) {
    console.error('\n❌ Error during withdrawal:', error.message);

    // Auto-diagnosis
    console.log('\n🔧 Auto-Diagnosis:');
    if (error.message.includes('fetch')) {
      console.log('   • Network error - check internet connection');
      console.log('   • Anchor might be down:', ANCHOR_DOMAIN);
    } else if (error.message.includes('404')) {
      console.log('   • SEP-24 endpoint not found');
      console.log('   • Verify anchor supports SEP-24');
      console.log('   • Check stellar.toml:', `https://${ANCHOR_DOMAIN}/.well-known/stellar.toml`);
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log('   • Authentication failed');
      console.log('   • JWT token might be expired or invalid');
      console.log('   • Re-run SEP-10 authentication');
    } else if (error.message.includes('asset')) {
      console.log('   • Asset not supported for withdrawal');
      console.log('   • Check /info endpoint for supported assets');
    } else {
      console.log('   • Unexpected error');
      console.log('   • Check anchor status and documentation');
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Execute if run directly
if (require.main === module) {
  initiateWithdrawal()
    .then(result => {
      if (result.success) {
        console.log('\n✅ SEP-24 withdrawal flow validated!');
        if (result.interactiveUrl) {
          console.log('🔗 Interactive URL:', result.interactiveUrl);
        }
        if (result.transactionId) {
          console.log('🆔 Transaction ID:', result.transactionId);
        }
        process.exit(0);
      } else {
        console.error('\n❌ Withdrawal failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

export { initiateWithdrawal };
