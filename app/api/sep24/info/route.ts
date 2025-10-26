import { NextRequest, NextResponse } from 'next/server';

const ANCHOR_DOMAIN = process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';
const TRANSFER_SERVER = `https://${ANCHOR_DOMAIN}/sep24`;

/**
 * GET /api/sep24/info
 * Fetches SEP-24 anchor information
 */
export async function GET(request: NextRequest) {
  try {
    const infoUrl = `${TRANSFER_SERVER}/info`;
    
    const response = await fetch(infoUrl);

    if (!response.ok) {
      throw new Error(`Anchor returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('SEP-24 info error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get anchor info',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
