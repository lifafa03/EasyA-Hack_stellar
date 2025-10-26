import { NextRequest, NextResponse } from 'next/server';
import { Transaction, Keypair, Networks } from '@stellar/stellar-sdk';

/**
 * POST /api/sep10/sign-client-domain
 * Adds client_domain signature to a challenge transaction
 * This is needed for MoneyGram which requires client_domain verification
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

    // Only add client_domain signature for MoneyGram
    if (anchor_domain !== 'extstellar.moneygram.com') {
      // For other anchors, just return the transaction unchanged
      return NextResponse.json({
        success: true,
        transaction: transaction_xdr,
      });
    }

    // Get client domain signing key from environment
    const clientDomainSecret = process.env.SIGNING_SECRET_KEY;
    
    if (!clientDomainSecret) {
      console.error('❌ SIGNING_SECRET_KEY not found in environment');
      return NextResponse.json(
        { error: 'Client domain signing key not configured' },
        { status: 500 }
      );
    }

    console.log('🔐 Adding client_domain signature for MoneyGram');

    // Parse the transaction
    const transaction = new Transaction(transaction_xdr, Networks.TESTNET);

    // Sign with client domain key
    const clientDomainKeypair = Keypair.fromSecret(clientDomainSecret);
    transaction.sign(clientDomainKeypair);

    const signedXdr = transaction.toXDR();
    console.log('✅ Client domain signature added');

    return NextResponse.json({
      success: true,
      transaction: signedXdr,
    });
  } catch (error: any) {
    console.error('Client domain signing error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sign with client domain',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
