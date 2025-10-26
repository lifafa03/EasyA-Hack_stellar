/**
 * Anchor Service
 * Handles fiat on/off-ramping through SEP-24 compliant anchors
 * Provides integration with Stellar anchors for currency conversion
 */

import { StellarError, ErrorCode } from '../types';

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'debit_card' | 'wire_transfer';

export interface OnRampParams {
  amount: string;
  currency: string;
  destinationAddress: string;
  paymentMethod: PaymentMethod;
}

export interface OffRampParams {
  amount: string;
  currency: string;
  sourceAddress: string;
  bankAccount: BankAccountInfo;
}

export interface BankAccountInfo {
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  bankName?: string;
}

export interface OnRampSession {
  id: string;
  url: string; // Interactive URL for SEP-24
  status: TransactionStatus;
  amount: string;
  currency: string;
  estimatedCompletion: number; // Unix timestamp
}

export interface OffRampSession {
  id: string;
  url: string; // Interactive URL for SEP-24
  status: TransactionStatus;
  amount: string;
  currency: string;
  estimatedCompletion: number; // Unix timestamp
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: string;
  fee: string;
  timestamp: number;
}

export type TransactionStatus = 
  | 'pending_user_transfer_start'
  | 'pending_user_transfer_complete'
  | 'pending_external'
  | 'pending_anchor'
  | 'pending_stellar'
  | 'pending_trust'
  | 'pending_user'
  | 'completed'
  | 'error'
  | 'refunded';

export interface InteractiveSession {
  id: string;
  url: string;
  type: 'deposit' | 'withdraw';
}

export interface AnchorInfo {
  domain: string;
  currencies: string[];
  features: {
    sep24: boolean;
    sep6: boolean;
    sep31: boolean;
  };
}

export class AnchorService {
  private anchorDomain: string;
  private transferServerUrl: string;
  private webAuthUrl: string;

  constructor(anchorDomain: string) {
    this.anchorDomain = anchorDomain;
    this.transferServerUrl = `https://${anchorDomain}/sep24`;
    this.webAuthUrl = `https://${anchorDomain}/auth`;
  }

  /**
   * Initialize on-ramp transaction (fiat to crypto)
   */
  async onRamp(params: OnRampParams): Promise<OnRampSession> {
    try {
      // Validate parameters
      this.validateOnRampParams(params);

      // Get authentication token
      const authToken = await this.getAuthToken(params.destinationAddress);

      // Initiate SEP-24 deposit transaction
      const response = await fetch(`${this.transferServerUrl}/transactions/deposit/interactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          asset_code: 'USDC', // Default to USDC, could be parameterized
          account: params.destinationAddress,
          amount: params.amount,
          lang: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Anchor API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        url: data.url,
        status: 'pending_user_transfer_start',
        amount: params.amount,
        currency: params.currency,
        estimatedCompletion: Date.now() / 1000 + (5 * 60), // 5 minutes estimate
      };
    } catch (error) {
      throw new StellarError(
        'Failed to initiate on-ramp',
        ErrorCode.ANCHOR_ERROR,
        error
      );
    }
  }

  /**
   * Initialize off-ramp transaction (crypto to fiat)
   */
  async offRamp(params: OffRampParams): Promise<OffRampSession> {
    try {
      // Validate parameters
      this.validateOffRampParams(params);

      // Get authentication token
      const authToken = await this.getAuthToken(params.sourceAddress);

      // Initiate SEP-24 withdrawal transaction
      const response = await fetch(`${this.transferServerUrl}/transactions/withdraw/interactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          asset_code: 'USDC', // Default to USDC
          account: params.sourceAddress,
          amount: params.amount,
          dest: params.bankAccount.accountNumber,
          dest_extra: JSON.stringify({
            routing_number: params.bankAccount.routingNumber,
            account_type: params.bankAccount.accountType,
          }),
          lang: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Anchor API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        url: data.url,
        status: 'pending_user_transfer_start',
        amount: params.amount,
        currency: params.currency,
        estimatedCompletion: Date.now() / 1000 + (24 * 60 * 60), // 24 hours estimate
      };
    } catch (error) {
      throw new StellarError(
        'Failed to initiate off-ramp',
        ErrorCode.ANCHOR_ERROR,
        error
      );
    }
  }

  /**
   * Get current exchange rate
   */
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    try {
      // Query anchor for exchange rate
      const response = await fetch(`${this.transferServerUrl}/price`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get exchange rate: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse rate data (simplified - actual format depends on anchor)
      return {
        from,
        to,
        rate: data.buy_price || '1.0',
        fee: data.fee || '0',
        timestamp: Date.now() / 1000,
      };
    } catch (error) {
      throw new StellarError(
        'Failed to get exchange rate',
        ErrorCode.ANCHOR_ERROR,
        error
      );
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(id: string, authToken?: string): Promise<TransactionStatus> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${this.transferServerUrl}/transaction?id=${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get transaction status: ${response.statusText}`);
      }

      const data = await response.json();
      return data.transaction.status as TransactionStatus;
    } catch (error) {
      throw new StellarError(
        'Failed to get transaction status',
        ErrorCode.ANCHOR_ERROR,
        error
      );
    }
  }

  /**
   * Start interactive deposit flow (SEP-24)
   */
  async startInteractiveDeposit(
    asset: string,
    account: string
  ): Promise<InteractiveSession> {
    try {
      const authToken = await this.getAuthToken(account);

      const response = await fetch(`${this.transferServerUrl}/transactions/deposit/interactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          asset_code: asset,
          account,
          lang: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start deposit: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        url: data.url,
        type: 'deposit',
      };
    } catch (error) {
      throw new StellarError(
        'Failed to start interactive deposit',
        ErrorCode.ANCHOR_ERROR,
        error
      );
    }
  }

  /**
   * Start interactive withdrawal flow (SEP-24)
   */
  async startInteractiveWithdraw(
    asset: string,
    account: string
  ): Promise<InteractiveSession> {
    try {
      const authToken = await this.getAuthToken(account);

      const response = await fetch(`${this.transferServerUrl}/transactions/withdraw/interactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          asset_code: asset,
          account,
          lang: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start withdrawal: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        url: data.url,
        type: 'withdraw',
      };
    } catch (error) {
      throw new StellarError(
        'Failed to start interactive withdrawal',
        ErrorCode.ANCHOR_ERROR,
        error
      );
    }
  }

  /**
   * Get anchor information
   */
  async getAnchorInfo(): Promise<AnchorInfo> {
    try {
      const response = await fetch(`https://${this.anchorDomain}/.well-known/stellar.toml`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch anchor info: ${response.statusText}`);
      }

      const tomlText = await response.text();
      
      // Parse TOML (simplified - would use a TOML parser in production)
      const info: AnchorInfo = {
        domain: this.anchorDomain,
        currencies: this.parseCurrenciesFromToml(tomlText),
        features: {
          sep24: tomlText.includes('TRANSFER_SERVER'),
          sep6: tomlText.includes('TRANSFER_SERVER_SEP0024'),
          sep31: tomlText.includes('DIRECT_PAYMENT_SERVER'),
        },
      };

      return info;
    } catch (error) {
      throw new StellarError(
        'Failed to get anchor info',
        ErrorCode.ANCHOR_ERROR,
        error
      );
    }
  }

  /**
   * Get authentication token using SEP-10
   */
  private async getAuthToken(account: string): Promise<string> {
    try {
      // In a real implementation, this would:
      // 1. Request challenge from anchor
      // 2. Sign challenge with user's wallet
      // 3. Submit signed challenge to get JWT token
      
      // For now, return a placeholder
      // This would be implemented with proper SEP-10 flow
      return 'AUTH_TOKEN_PLACEHOLDER';
    } catch (error) {
      throw new StellarError(
        'Failed to get authentication token',
        ErrorCode.ANCHOR_ERROR,
        error
      );
    }
  }

  /**
   * Validate on-ramp parameters
   */
  private validateOnRampParams(params: OnRampParams): void {
    if (!params.amount || parseFloat(params.amount) <= 0) {
      throw new StellarError(
        'Amount must be greater than 0',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.currency) {
      throw new StellarError(
        'Currency is required',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.destinationAddress) {
      throw new StellarError(
        'Destination address is required',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.paymentMethod) {
      throw new StellarError(
        'Payment method is required',
        ErrorCode.INVALID_PARAMS
      );
    }
  }

  /**
   * Validate off-ramp parameters
   */
  private validateOffRampParams(params: OffRampParams): void {
    if (!params.amount || parseFloat(params.amount) <= 0) {
      throw new StellarError(
        'Amount must be greater than 0',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.currency) {
      throw new StellarError(
        'Currency is required',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.sourceAddress) {
      throw new StellarError(
        'Source address is required',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.bankAccount) {
      throw new StellarError(
        'Bank account information is required',
        ErrorCode.INVALID_PARAMS
      );
    }

    if (!params.bankAccount.accountNumber || !params.bankAccount.routingNumber) {
      throw new StellarError(
        'Bank account number and routing number are required',
        ErrorCode.INVALID_PARAMS
      );
    }
  }

  /**
   * Parse currencies from TOML file
   */
  private parseCurrenciesFromToml(toml: string): string[] {
    // Simplified parser - would use proper TOML parser in production
    const currencies: string[] = [];
    const lines = toml.split('\n');
    
    for (const line of lines) {
      if (line.includes('code =')) {
        const match = line.match(/code\s*=\s*"([^"]+)"/);
        if (match) {
          currencies.push(match[1]);
        }
      }
    }

    return currencies;
  }
}
