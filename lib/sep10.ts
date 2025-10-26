/**
 * SEP-10 Web Authentication Helpers
 * Provides encoding/parsing guards and validation utilities
 */

/**
 * Checks if a string looks like valid base64-encoded XDR
 */
export function isBase64Xdr(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  // Remove whitespace
  const cleaned = str.trim();
  
  // Must be base64 charset
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleaned)) return false;
  
  // XDR envelopes are typically at least 200 chars
  if (cleaned.length < 200) return false;
  
  return true;
}

/**
 * Extracts the transaction XDR from various response formats
 * Supports: transaction, tx, transaction_envelope_xdr
 */
export function extractTransactionXdr(response: any): string {
  const xdr = response.transaction ?? response.tx ?? response.transaction_envelope_xdr;
  
  if (!xdr) {
    throw new Error(
      'Challenge response missing transaction field. ' +
      'Expected one of: transaction, tx, transaction_envelope_xdr'
    );
  }
  
  // Clean the XDR string
  let cleaned = typeof xdr === 'string' ? xdr.trim() : String(xdr);
  
  // Remove quotes if present (from JSON serialization)
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  
  // URL decode if needed (some anchors return URL-encoded XDR)
  if (cleaned.includes('%')) {
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch (e) {
      // Not URL-encoded, continue
    }
  }
  
  if (!isBase64Xdr(cleaned)) {
    throw new Error(
      `Invalid XDR format. Expected base64 string, got: ${cleaned.substring(0, 50)}...`
    );
  }
  
  return cleaned;
}

/**
 * Validates network passphrase matches expected
 */
export function validateNetworkPassphrase(
  received: string | undefined,
  expected: string
): void {
  if (received && received !== expected) {
    throw new Error(
      `Network passphrase mismatch. Expected "${expected}", got "${received}"`
    );
  }
}

/**
 * Extracts signed XDR from Freighter's response
 */
export function extractFreighterSignature(result: any): string {
  let signedXdr: string;
  
  if (typeof result === 'string') {
    signedXdr = result;
  } else if (result && typeof result === 'object') {
    // Try different field names Freighter might use
    signedXdr = result.signedTxXdr ?? result.signedTransaction ?? result.xdr;
    
    if (!signedXdr) {
      throw new Error(
        'Freighter signature result missing XDR. ' +
        `Got: ${JSON.stringify(Object.keys(result))}`
      );
    }
  } else {
    throw new Error('Unexpected Freighter signature format');
  }
  
  // Clean the XDR
  signedXdr = signedXdr.trim().replace(/^["']|["']$/g, '');
  
  if (!isBase64Xdr(signedXdr)) {
    throw new Error(
      `Freighter returned invalid XDR: ${signedXdr.substring(0, 50)}...`
    );
  }
  
  return signedXdr;
}

/**
 * Sanitizes a string to remove quotes and whitespace
 */
export function sanitizeXdr(xdr: string): string {
  return xdr.trim().replace(/^["']|["']$/g, '');
}
