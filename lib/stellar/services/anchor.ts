/**
 * Anchor Service
 * Handles fiat on/off-ramping through SEP-24 compliant anchors
 * Provides integration with Stellar anchors for currency conversion
 */

import {
  Transaction,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { StellarError, ErrorCode } from '../types';
import { getStellarSDK } from '../sdk';
import { getStellarConfig } from '../config';

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

interface CachedExchangeRate {
  rate: ExchangeRate;
  expiresAt: number;
}

interface TrustlineInfo {
  exists: boolean;
  asset: Asset;
  balance?: string;
  limit?: string;
}

export class AnchorService {
  private anchorDomain: string;
  private transferServerUrl: string;
  private webAuthUrl: string;
  private exchangeRateCache: Map<string, CachedExchangeRate> = new Map();
  private readonly RATE_CACHE_TTL = 30000; // 30 seconds
  private authTokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor(anchorDomain: string) {
    this.anchorDomain = anchorDomain;
    this.transferServerUrl = `https://${anchorDomain}/sep24`;
    this.webAuthUrl = `https://${anchorDomain}/auth`;
  }

  /**
   * Get the anchor domain
   */
  getAnchorDomain(): string {
    return this.anchorDomain;
  }

  /**
   * Initialize on-ramp transaction (fiat to crypto)
   */
  async onRamp(
    params: OnRampParams,
    signer: (tx: Transaction) => Promise<Transaction>
  ): Promise<OnRampSession> {
    try {
      // Validate parameters
      this.validateOnRampParams(params);

      // Get authentication token
      const authToken = await this.getAuthToken(params.destinationAddress, signer);

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
  async offRamp(
    params: OffRampParams,
    signer: (tx: Transaction) => Promise<Transaction>
  ): Promise<OffRampSession> {
    try {
      // Validate parameters
      this.validateOffRampParams(params);

      // Get authentication token
      const authToken = await this.getAuthToken(params.sourceAddress, signer);

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
   * Get current exchange rate with caching (30-second TTL)
   */
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    try {
      const cacheKey = `${from}-${to}`;
      const cached = this.exchangeRateCache.get(cacheKey);

      // Return cached rate if still valid
      if (cached && cached.expiresAt > Date.now()) {
        return cached.rate;
      }

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
      const rate: ExchangeRate = {
        from,
        to,
        rate: data.buy_price || '1.0',
        fee: data.fee || '0',
        timestamp: Date.now() / 1000,
      };

      // Cache the rate
      this.exchangeRateCache.set(cacheKey, {
        rate,
        expiresAt: Date.now() + this.RATE_CACHE_TTL,
      });

      return rate;
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
    account: string,
    signer: (tx: Transaction) => Promise<Transaction>
  ): Promise<InteractiveSession> {
    try {
      const authToken = await this.getAuthToken(account, signer);

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
    account: string,
    signer: (tx: Transaction) => Promise<Transaction>
  ): Promise<InteractiveSession> {
    try {
      const authToken = await this.getAuthToken(account, signer);

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
   * Check if a trustline exists for a specific asset
   */
  async checkTrustline(
    account: string,
    assetCode: string,
    assetIssuer: string
  ): Promise<TrustlineInfo> {
    try {
      const sdk = getStellarSDK();
      const accountData = await sdk.getAccount(account);
      
      const asset = new Asset(assetCode, assetIssuer);
      
      // Check if trustline exists in account balances
      const balance = accountData.balances.find(
        (b: any) =>
          b.asset_type !== 'native' &&
          b.asset_code === assetCode &&
          b.asset_issuer === assetIssuer
      );

      if (balance) {
        return {
          exists: true,
          asset,
          balance: balance.balance,
          limit: balance.limit,
        };
      }

      return {
        exists: false,
        asset,
      };
    } catch (error) {
      throw new StellarError(
        'Failed to check trustline',
        ErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Create a trustline for a specific asset
   */
  async createTrustline(
    account: string,
    assetCode: string,
    assetIssuer: string,
    signer: (tx: Transaction) => Promise<Transaction>,
    limit?: string
  ): Promise<string> {
    try {
      const sdk = getStellarSDK();
      const config = getStellarConfig();
      
      // Check if trustline already exists
      const trustlineInfo = await this.checkTrustline(account, assetCode, assetIssuer);
      if (trustlineInfo.exists) {
        throw new StellarError(
          'Trustline already exists',
          ErrorCode.INVALID_PARAMS
        );
      }

      const asset = new Asset(assetCode, assetIssuer);
      
      // Build change trust operation
      const changeTrustOp = Operation.changeTrust({
        asset,
        limit: limit || '922337203685.4775807', // Max limit
      }) as any; // Type assertion needed due to SDK type complexity

      // Build and sign transaction
      const transaction = await sdk.buildTransaction(account, [changeTrustOp]);
      const signedTx = await signer(transaction);
      
      // Submit transaction
      const result = await sdk.submitTransaction(signedTx);
      
      if (result.status !== 'success') {
        throw new Error('Trustline creation transaction failed');
      }

      return result.hash;
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to create trustline',
        ErrorCode.TRANSACTION_FAILED,
        error
      );
    }
  }

  /**
   * Poll transaction status with exponential backoff
   */
  async pollTransactionStatus(
    transactionId: string,
    authToken: string,
    options: {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
      onStatusChange?: (status: TransactionStatus) => void;
    } = {}
  ): Promise<TransactionStatus> {
    const {
      maxAttempts = 40, // ~10 minutes with exponential backoff
      initialDelay = 5000, // 5 seconds
      maxDelay = 15000, // 15 seconds
      onStatusChange,
    } = options;

    let attempt = 0;
    let delay = initialDelay;
    let lastStatus: TransactionStatus | null = null;

    while (attempt < maxAttempts) {
      try {
        const status = await this.getTransactionStatus(transactionId, authToken);

        // Notify if status changed
        if (status !== lastStatus && onStatusChange) {
          onStatusChange(status);
        }
        lastStatus = status;

        // Check if transaction is in a final state
        if (
          status === 'completed' ||
          status === 'error' ||
          status === 'refunded'
        ) {
          return status;
        }

        // Wait before next poll with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        
        // Increase delay for next attempt (exponential backoff)
        delay = Math.min(delay * 1.5, maxDelay);
        attempt++;
      } catch (error) {
        // On error, wait and retry
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, maxDelay);
        attempt++;
      }
    }

    throw new StellarError(
      'Transaction polling timeout',
      ErrorCode.ANCHOR_ERROR
    );
  }

  /**
   * Get authentication token using SEP-10
   */
  async getAuthToken(
    account: string,
    signer: (tx: Transaction) => Promise<Transaction>
  ): Promise<string> {
    try {
      // Check cache first
      const cached = this.authTokenCache.get(account);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.token;
      }

      // Step 1: Request challenge from anchor
      const challengeResponse = await fetch(
        `${this.webAuthUrl}?account=${account}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!challengeResponse.ok) {
        throw new Error(`Failed to get challenge: ${challengeResponse.statusText}`);
      }

      const challengeData = await challengeResponse.json();
      const challengeXdr = challengeData.transaction;

      if (!challengeXdr) {
        throw new Error('No challenge transaction received from anchor');
      }

      // Step 2: Parse and sign the challenge transaction
      const config = getStellarConfig();
      const transaction = TransactionBuilder.fromXDR(
        challengeXdr,
        config.networkPassphrase
      ) as Transaction;

      const signedTx = await signer(transaction);

      // Step 3: Submit signed challenge to get JWT token
      const tokenResponse = await fetch(this.webAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: signedTx.toXDR(),
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get token: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.token;

      if (!token) {
        throw new Error('No token received from anchor');
      }

      // Cache the token (typically valid for 24 hours, we'll cache for 23 hours)
      this.authTokenCache.set(account, {
        token,
        expiresAt: Date.now() + 23 * 60 * 60 * 1000,
      });

      return token;
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
