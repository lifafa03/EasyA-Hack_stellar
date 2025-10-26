import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/sep10/challenge
 * Fetches SEP-10 authentication challenge from anchor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, anchor_domain } = body;

    if (!account) {
      return NextResponse.json(
        { error: 'Missing account parameter' },
        { status: 400 }
      );
    }

    // Use provided anchor domain or default to testanchor
    const ANCHOR_DOMAIN = anchor_domain || process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';
    
    // Construct auth endpoint based on anchor
    let WEB_AUTH_ENDPOINT: string;
    if (ANCHOR_DOMAIN === 'extstellar.moneygram.com') {
      WEB_AUTH_ENDPOINT = `https://${ANCHOR_DOMAIN}/stellaradapterservice/auth`;
    } else {
      WEB_AUTH_ENDPOINT = `https://${ANCHOR_DOMAIN}/auth`;
    }

    // Request challenge from anchor
    const challengeUrl = `${WEB_AUTH_ENDPOINT}?account=${account}`;
    console.log('🔍 Requesting challenge from:', challengeUrl);
    
    const response = await fetch(challengeUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Challenge request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: challengeUrl,
        errorBody: errorText
      });
      
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error || errorJson.message || errorText;
      } catch (e) {
        // Not JSON, use text as-is
      }
      
      throw new Error(`Anchor returned ${response.status}: ${errorDetails}`);
    }

    const data = await response.json();
    console.log('✅ Challenge received successfully');

    return NextResponse.json({
      success: true,
      transaction: data.transaction,
      network_passphrase: data.network_passphrase || 'Test SDF Network ; September 2015',
    });
  } catch (error: any) {
    console.error('SEP-10 challenge error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get challenge',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
