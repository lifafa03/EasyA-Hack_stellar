import * as StellarSDK from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const ANCHOR_DOMAIN = process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';
const USER_PUBLIC_KEY = process.env.USER_PUBLIC_KEY;
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

// SEP-10 endpoints (from SEP-1 discovery)
const WEB_AUTH_ENDPOINT = `https://${ANCHOR_DOMAIN}/auth`;

interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  challengeTx?: string;
}

async function authenticateWithSEP10(): Promise<AuthResult> {
  console.log('\n🔐 CHECKPOINT 5: SEP-10 Authentication');
  console.log('='.repeat(70));

  if (!USER_PUBLIC_KEY) {
    return {
      success: false,
      error: 'USER_PUBLIC_KEY not found in .env'
    };
  }

  try {
    console.log('📍 User Account:', USER_PUBLIC_KEY);
    console.log('🏦 Anchor:', ANCHOR_DOMAIN);
    console.log('🔗 Auth Endpoint:', WEB_AUTH_ENDPOINT);

    // Step 1: GET challenge from anchor
    console.log('\n🔍 Step 1: Requesting challenge from anchor...');
    const challengeUrl = `${WEB_AUTH_ENDPOINT}?account=${USER_PUBLIC_KEY}`;
    
    const challengeResponse = await fetch(challengeUrl);
    if (!challengeResponse.ok) {
      throw new Error(`Failed to get challenge: ${challengeResponse.status} ${challengeResponse.statusText}`);
    }

    const challengeData = await challengeResponse.json();
    console.log('   ✅ Challenge received!');
    console.log('   Network:', challengeData.network_passphrase || 'Not specified');

    const challengeTx = challengeData.transaction;
    if (!challengeTx) {
      return {
        success: false,
        error: 'No transaction in challenge response'
      };
    }

    // Step 2: Parse and validate challenge
    console.log('\n🔍 Step 2: Validating challenge transaction...');
    const transaction = new StellarSDK.Transaction(
      challengeTx,
      challengeData.network_passphrase || NETWORK_PASSPHRASE
    );

    console.log('   Source Account:', transaction.source);
    console.log('   Sequence:', transaction.sequence);
    console.log('   Operations:', transaction.operations.length);

    // Validate it's a valid SEP-10 challenge
    if (transaction.operations.length === 0) {
      return {
        success: false,
        error: 'Challenge has no operations'
      };
    }

    const manageDataOp = transaction.operations[0];
    if (manageDataOp.type !== 'manageData') {
      return {
        success: false,
        error: `Invalid operation type: ${manageDataOp.type}`
      };
    }

    console.log('   ✅ Valid SEP-10 challenge');

    // ⚠️ CRITICAL: This requires signing with secret key
    console.log('\n⚠️  AUTHENTICATION REQUIRES SIGNING');
    console.log('='.repeat(70));
    console.log('\n📋 To complete authentication, you have 2 options:\n');

    console.log('Option 1: Add SECRET_KEY to .env and re-run');
    console.log('   1. Add this line to .env: SECRET_KEY=your_secret_key_here');
    console.log('   2. Re-run: npm run sep10\n');

    console.log('Option 2: Use Freighter API (Recommended)');
    console.log('   This will be implemented in the Next.js UI.');
    console.log('   Freighter can sign the challenge without exposing your secret.\n');

    console.log('Option 3: Manual signing (for testing)');
    console.log('   1. Copy challenge XDR:', challengeTx);
    console.log('   2. Go to: https://laboratory.stellar.org/#xdr-viewer?type=TransactionEnvelope');
    console.log('   3. Import and sign with your secret key');
    console.log('   4. Submit signed XDR to:', WEB_AUTH_ENDPOINT);
    console.log('   5. Method: POST');
    console.log('   6. Body: {"transaction": "<signed_xdr>"}\n');

    console.log('='.repeat(70));
    console.log('ℹ️  CHECKPOINT 5 is PARTIALLY COMPLETE');
    console.log('   Challenge received ✅, but requires signing for JWT token.');
    console.log('='.repeat(70));

    return {
      success: true,
      challengeTx,
      token: undefined // Will be set after signing
    };

  } catch (error: any) {
    console.error('\n❌ Error during authentication:', error.message);

    // Auto-diagnosis
    console.log('\n🔧 Auto-Diagnosis:');
    if (error.message.includes('fetch')) {
      console.log('   • Network error - check internet connection');
      console.log('   • Anchor might be down:', ANCHOR_DOMAIN);
    } else if (error.message.includes('404')) {
      console.log('   • Auth endpoint not found');
      console.log('   • Verify anchor supports SEP-10');
      console.log('   • Check stellar.toml:', `https://${ANCHOR_DOMAIN}/.well-known/stellar.toml`);
    } else if (error.message.includes('account')) {
      console.log('   • Account validation failed');
      console.log('   • Verify USER_PUBLIC_KEY in .env');
    } else {
      console.log('   • Unexpected error');
      console.log('   • Check anchor status');
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Execute if run directly
if (require.main === module) {
  authenticateWithSEP10()
    .then(result => {
      if (result.success) {
        console.log('\n✅ SEP-10 challenge validated successfully!');
        if (result.token) {
          console.log('🎫 JWT Token:', result.token.substring(0, 50) + '...');
        }
        process.exit(0);
      } else {
        console.error('\n❌ Authentication failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

export { authenticateWithSEP10 };
