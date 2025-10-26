import { NextRequest, NextResponse } from 'next/server';
import { Transaction, Keypair, Networks } from '@stellar/stellar-sdk';
import { sanitizeXdr } from '@/lib/sep10';

/**
 * POST /api/sep10/sign-client-domain
 * SEP-10 Step 3: Adds client_domain signature + submits to anchor for JWT
 * 
 * Flow:
 * 1. Receives XDR signed by user's wallet (Signature #1)
 * 2. Adds client_domain signature (Signature #2) 
 * 3. POSTs dual-signed tx to anchor's WEB_AUTH_ENDPOINT
 * 4. Returns JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_xdr, anchor_domain } = body;

    if (!transaction_xdr) {
      return NextResponse.json(
        { error: 'Missing transaction_xdr parameter' },
        { status: 400 }
      );
    }

    if (!anchor_domain) {
      return NextResponse.json(
        { error: 'Missing anchor_domain parameter' },
        { status: 400 }
      );
    }

    // Only add client_domain signature for MoneyGram
    if (anchor_domain !== 'extstellar.moneygram.com') {
      console.log('⚠️ Non-MoneyGram anchor, skipping client_domain signature');
      
      // For other anchors, submit directly to get token
      return await submitToAnchor(transaction_xdr, anchor_domain);
    }

    // Get client domain signing key from environment
    let clientDomainSecret = process.env.SIGNING_SECRET_KEY;
    
    if (!clientDomainSecret) {
      console.error('❌ SIGNING_SECRET_KEY not found in environment');
      return NextResponse.json(
        { error: 'Client domain signing key not configured' },
        { status: 500 }
      );
    }

    // Remove quotes if present (from .env.local format)
    clientDomainSecret = clientDomainSecret.replace(/^["']|["']$/g, '');

    console.log('🔐 Adding client_domain signature for MoneyGram');
    console.log('📄 Input XDR preview:', transaction_xdr.substring(0, 20) + '...');

    // Sanitize and parse the transaction
    const cleanXdr = sanitizeXdr(transaction_xdr);
    const transaction = new Transaction(cleanXdr, Networks.TESTNET);
    
    console.log('✅ Transaction parsed, current signatures:', transaction.signatures.length);

    // Sign with client domain key (adds Signature #2)
    const clientDomainKeypair = Keypair.fromSecret(clientDomainSecret);
    transaction.sign(clientDomainKeypair);

    console.log('✅ Client domain signature added, total signatures:', transaction.signatures.length);

    const signedXdr = transaction.toXDR();

    // Submit dual-signed transaction to anchor
    return await submitToAnchor(signedXdr, anchor_domain);
    
  } catch (error: any) {
    console.error('❌ Client domain signing error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sign with client domain',
        details: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Submits signed challenge to anchor's WEB_AUTH_ENDPOINT to obtain JWT
 */
async function submitToAnchor(signedXdr: string, anchorDomain: string) {
  try {
    // Construct WEB_AUTH_ENDPOINT
    let authEndpoint: string;
    if (anchorDomain === 'extstellar.moneygram.com') {
      authEndpoint = `https://${anchorDomain}/stellaradapterservice/auth`;
    } else {
      authEndpoint = `https://${anchorDomain}/auth`;
    }

    console.log('📤 Submitting to anchor:', authEndpoint);

    // POST signed transaction to anchor
    const response = await fetch(authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: signedXdr }),
    });

    const responseText = await response.text();
    console.log('📥 Anchor response status:', response.status);

    if (!response.ok) {
      console.error('❌ Anchor rejected:', responseText);
      throw new Error(
        `Anchor returned ${response.status}: ${responseText.substring(0, 200)}`
      );
    }

    const data = JSON.parse(responseText);

    if (!data.token) {
      throw new Error('Anchor response missing JWT token');
    }

    console.log('✅ JWT token obtained successfully');

    return NextResponse.json({
      success: true,
      token: data.token,
      expires_at: data.expires_at,
    });
    
  } catch (error: any) {
    console.error('❌ Token submission error:', error);
    throw error;
  }
}

