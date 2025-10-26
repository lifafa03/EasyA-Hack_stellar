import { NextRequest, NextResponse } from 'next/server';

const ANCHOR_DOMAIN = process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';
const WEB_AUTH_ENDPOINT = `https://${ANCHOR_DOMAIN}/auth`;

/**
 * POST /api/sep10/token
 * Submits signed challenge to get JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signedTransaction } = body;

    if (!signedTransaction) {
      return NextResponse.json(
        { error: 'Missing signedTransaction in request body' },
        { status: 400 }
      );
    }

    // Submit signed transaction to anchor
    const response = await fetch(WEB_AUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: signedTransaction }),
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
