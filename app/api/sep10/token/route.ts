import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/sep10/token
 * Submits signed challenge to get JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction, anchor_domain } = body;

    if (!transaction) {
      return NextResponse.json(
        { error: 'Missing transaction in request body' },
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

    // Submit signed transaction to anchor
    const response = await fetch(WEB_AUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anchor returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      token: data.token,
    });
  } catch (error: any) {
    console.error('SEP-10 token error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get token',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
