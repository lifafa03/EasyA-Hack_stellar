import { NextRequest, NextResponse } from 'next/server';

const ANCHOR_DOMAIN = process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';
const TRANSFER_SERVER = `https://${ANCHOR_DOMAIN}/sep24`;

/**
 * POST /api/sep24/withdraw
 * Initiates SEP-24 interactive withdrawal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, asset_code, asset_issuer, account, amount } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing JWT token' },
        { status: 401 }
      );
    }

    if (!asset_code || !account) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initiate withdrawal
    const withdrawUrl = `${TRANSFER_SERVER}/transactions/withdraw/interactive`;
    
    const response = await fetch(withdrawUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset_code,
        asset_issuer,
        account,
        amount,
        lang: 'en',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anchor returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      url: data.url,
      id: data.id,
      type: data.type,
    });
  } catch (error: any) {
    console.error('SEP-24 withdraw error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to initiate withdrawal',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
