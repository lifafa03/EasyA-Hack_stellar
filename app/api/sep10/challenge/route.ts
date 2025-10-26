import { NextRequest, NextResponse } from 'next/server';

const ANCHOR_DOMAIN = process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';
const WEB_AUTH_ENDPOINT = `https://${ANCHOR_DOMAIN}/auth`;

/**
 * GET /api/sep10/challenge
 * Fetches SEP-10 authentication challenge from anchor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get('account');

    if (!account) {
      return NextResponse.json(
        { error: 'Missing account parameter' },
        { status: 400 }
      );
    }

    // Request challenge from anchor
    const challengeUrl = `${WEB_AUTH_ENDPOINT}?account=${account}`;
    const response = await fetch(challengeUrl);

    if (!response.ok) {
      throw new Error(`Anchor returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

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
