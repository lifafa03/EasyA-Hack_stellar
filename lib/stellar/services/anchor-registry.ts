/**
 * Anchor Registry Service
 * Manages multiple Stellar anchor providers for fiat on/off-ramp functionality
 */

export interface AnchorProvider {
  id: string;
  name: string;
  domain: string;
  logo: string;
  supportedCurrencies: string[];
  supportedRegions: string[];
  fees: {
    deposit: string;
    withdrawal: string;
  };
  processingTime: {
    deposit: string;
    withdrawal: string;
  };
  description?: string;
}

/**
 * Registry of available Stellar anchor providers
 */
export class AnchorRegistry {
  private static readonly PREFERRED_ANCHOR_KEY = 'stellar_preferred_anchor';
  
  private static readonly anchors: AnchorProvider[] = [
    {
      id: 'moneygram',
      name: 'MoneyGram Access',
      domain: 'api.moneygram.com',
      logo: '/anchors/moneygram-logo.png',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN', 'PHP', 'INR'],
      supportedRegions: ['US', 'EU', 'UK', 'CA', 'AU', 'MX', 'PH', 'IN', 'GLOBAL'],
      fees: {
        deposit: '1.5%',
        withdrawal: '2.0%',
      },
      processingTime: {
        deposit: '5-15 minutes',
        withdrawal: '1-3 business days',
      },
      description: 'Global money transfer service with extensive coverage and competitive rates',
    },
    {
      id: 'anchorusd',
      name: 'AnchorUSD',
      domain: 'api.anchorusd.com',
      logo: '/anchors/anchorusd-logo.png',
      supportedCurrencies: ['USD', 'USDC'],
      supportedRegions: ['US'],
      fees: {
        deposit: '0.5%',
        withdrawal: '1.0%',
      },
      processingTime: {
        deposit: '2-10 minutes',
        withdrawal: '1-2 business days',
      },
      description: 'US-focused anchor with low fees and fast processing times',
    },
    {
      id: 'vibrant',
      name: 'Vibrant',
      domain: 'api.vibrantapp.com',
      logo: '/anchors/vibrant-logo.png',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS'],
      supportedRegions: ['US', 'EU', 'UK', 'NG', 'KE', 'GH', 'AFRICA'],
      fees: {
        deposit: '1.0%',
        withdrawal: '1.5%',
      },
      processingTime: {
        deposit: '3-12 minutes',
        withdrawal: '1-2 business days',
      },
      description: 'Multi-region anchor with strong presence in Africa and competitive European rates',
    },
  ];

  /**
   * Get all available anchors, optionally filtered by region
   * @param region Optional region code to filter anchors (e.g., 'US', 'EU', 'GLOBAL')
   * @returns Array of anchor providers
   */
  static getAvailableAnchors(region?: string): AnchorProvider[] {
    if (!region) {
      return [...this.anchors];
    }

    return this.anchors.filter(anchor => 
      anchor.supportedRegions.includes(region.toUpperCase()) ||
      anchor.supportedRegions.includes('GLOBAL')
    );
  }

  /**
   * Get a specific anchor by its ID
   * @param id Anchor identifier
   * @returns Anchor provider or null if not found
   */
  static getAnchorById(id: string): AnchorProvider | null {
    return this.anchors.find(anchor => anchor.id === id) || null;
  }

  /**
   * Get the user's preferred anchor from localStorage
   * @param userId User identifier (optional, defaults to 'default')
   * @returns Preferred anchor provider or null if not set
   */
  static getPreferredAnchor(userId: string = 'default'): AnchorProvider | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(`${this.PREFERRED_ANCHOR_KEY}_${userId}`);
      if (!stored) {
        return null;
      }

      const anchorId = JSON.parse(stored);
      return this.getAnchorById(anchorId);
    } catch (error) {
      console.error('Error retrieving preferred anchor:', error);
      return null;
    }
  }

  /**
   * Set the user's preferred anchor in localStorage
   * @param userId User identifier (optional, defaults to 'default')
   * @param anchorId Anchor identifier to set as preferred
   * @returns True if successfully saved, false otherwise
   */
  static setPreferredAnchor(userId: string = 'default', anchorId: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Validate that the anchor exists
    const anchor = this.getAnchorById(anchorId);
    if (!anchor) {
      console.error(`Invalid anchor ID: ${anchorId}`);
      return false;
    }

    try {
      localStorage.setItem(`${this.PREFERRED_ANCHOR_KEY}_${userId}`, JSON.stringify(anchorId));
      return true;
    } catch (error) {
      console.error('Error saving preferred anchor:', error);
      return false;
    }
  }

  /**
   * Clear the user's preferred anchor
   * @param userId User identifier (optional, defaults to 'default')
   */
  static clearPreferredAnchor(userId: string = 'default'): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(`${this.PREFERRED_ANCHOR_KEY}_${userId}`);
    } catch (error) {
      console.error('Error clearing preferred anchor:', error);
    }
  }

  /**
   * Get anchors that support a specific currency
   * @param currency Currency code (e.g., 'USD', 'EUR')
   * @returns Array of anchor providers supporting the currency
   */
  static getAnchorsByCurrency(currency: string): AnchorProvider[] {
    return this.anchors.filter(anchor =>
      anchor.supportedCurrencies.includes(currency.toUpperCase())
    );
  }

  /**
   * Get all unique supported currencies across all anchors
   * @returns Array of currency codes
   */
  static getAllSupportedCurrencies(): string[] {
    const currencies = new Set<string>();
    this.anchors.forEach(anchor => {
      anchor.supportedCurrencies.forEach(currency => currencies.add(currency));
    });
    return Array.from(currencies).sort();
  }

  /**
   * Get all unique supported regions across all anchors
   * @returns Array of region codes
   */
  static getAllSupportedRegions(): string[] {
    const regions = new Set<string>();
    this.anchors.forEach(anchor => {
      anchor.supportedRegions.forEach(region => regions.add(region));
    });
    return Array.from(regions).sort();
  }
}
