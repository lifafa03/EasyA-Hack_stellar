import { NextRequest, NextResponse } from 'next/server';

const ANCHOR_DOMAIN = process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';
const TRANSFER_SERVER = `https://${ANCHOR_DOMAIN}/sep24`;

/**
 * GET /api/sep24/transaction
 * Gets status of a SEP-24 transaction
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing JWT token' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Missing transaction id' },
        { status: 400 }
      );
    }

    // Get transaction status
    const statusUrl = `${TRANSFER_SERVER}/transaction?id=${id}`;
    
    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anchor returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      transaction: data.transaction,
    });
  } catch (error: any) {
    console.error('SEP-24 transaction status error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get transaction status',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
