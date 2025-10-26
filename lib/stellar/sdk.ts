/**
 * Base Stellar SDK wrapper class with network configuration
 */

import {
  Server,
  Networks,
  Transaction,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  BASE_FEE,
  SorobanRpc,
} from '@stellar/stellar-sdk';
import {
  StellarConfig,
  TransactionResult,
  TransactionOptions,
  StellarError,
  ErrorCode,
  EventCallback,
  Subscription,
  Signer,
} from './types';
import { getStellarConfig, validateConfig } from './config';

export class StellarSDK {
  private server: Server;
  private sorobanServer: SorobanRpc.Server;
  private config: StellarConfig;
  private networkPassphrase: string;

  constructor(config?: StellarConfig) {
    this.config = config || getStellarConfig();
    validateConfig(this.config);

    this.server = new Server(this.config.horizonUrl);
    this.sorobanServer = new SorobanRpc.Server(this.config.sorobanRpcUrl);
    this.networkPassphrase = this.config.networkPassphrase;
  }

  /**
   * Get the Horizon server instance
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Get the Soroban RPC server instance
   */
  getSorobanServer(): SorobanRpc.Server {
    return this.sorobanServer;
  }

  /**
   * Get the current network configuration
   */
  getConfig(): StellarConfig {
    return this.config;
  }

  /**
   * Get the network passphrase
   */
  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  /**
   * Build a transaction with the given operations
   */
  async buildTransaction(
    sourceAccount: string,
    operations: Operation[],
    options: TransactionOptions = {}
  ): Promise<Transaction> {
    try {
      const account = await this.server.loadAccount(sourceAccount);
      
      const fee = options.fee || BASE_FEE;
      const timeout = options.timeout || 180; // 3 minutes default

      const transactionBuilder = new TransactionBuilder(account, {
        fee,
        networkPassphrase: this.networkPassphrase,
      });

      // Add all operations
      operations.forEach(op => transactionBuilder.addOperation(op));

      // Set timeout
      transactionBuilder.setTimeout(timeout);

      return transactionBuilder.build();
    } catch (error) {
      throw new StellarError(
        'Failed to build transaction',
        ErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Submit a signed transaction to the network
   */
  async submitTransaction(
    transaction: Transaction,
    options: { retry?: boolean; maxRetries?: number } = {}
  ): Promise<TransactionResult> {
    const { retry = true, maxRetries = 3 } = options;
    let lastError: any;

    for (let attempt = 0; attempt < (retry ? maxRetries : 1); attempt++) {
      try {
        const response = await this.server.submitTransaction(transaction);

        return {
          hash: response.hash,
          status: response.successful ? 'success' : 'failed',
          ledger: response.ledger,
          createdAt: new Date().toISOString(),
        };
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (error?.response?.status === 400) {
          throw new StellarError(
            'Invalid transaction',
            ErrorCode.TRANSACTION_FAILED,
            error
          );
        }

        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw new StellarError(
      'Transaction submission failed after retries',
      ErrorCode.NETWORK_ERROR,
      lastError
    );
  }

  /**
   * Sign and submit a transaction
   */
  async signAndSubmit(
    transaction: Transaction,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const signedTx = await signer.sign(transaction);
      return await this.submitTransaction(signedTx);
    } catch (error) {
      if (error instanceof StellarError) {
        throw error;
      }
      throw new StellarError(
        'Failed to sign and submit transaction',
        ErrorCode.WALLET_ERROR,
        error
      );
    }
  }

  /**
   * Get account details
   */
  async getAccount(publicKey: string) {
    try {
      return await this.server.loadAccount(publicKey);
    } catch (error) {
      throw new StellarError(
        'Failed to load account',
        ErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Get account balance for a specific asset
   */
  async getBalance(publicKey: string, assetCode?: string): Promise<string> {
    try {
      const account = await this.getAccount(publicKey);
      
      if (!assetCode || assetCode === 'XLM') {
        const nativeBalance = account.balances.find(
          (balance: any) => balance.asset_type === 'native'
        );
        return nativeBalance?.balance || '0';
      }

      const assetBalance = account.balances.find(
        (balance: any) => 
          balance.asset_type !== 'native' && 
          balance.asset_code === assetCode
      );
      
      return assetBalance?.balance || '0';
    } catch (error) {
      throw new StellarError(
        'Failed to get balance',
        ErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Subscribe to contract events
   */
  subscribeToContractEvents(
    contractId: string,
    callback: EventCallback
  ): Subscription {
    // Create event stream for the contract
    const eventStream = this.server
      .events()
      .forContract(contractId)
      .cursor('now')
      .stream({
        onmessage: (event: any) => {
          callback({
            type: event.type,
            contractId,
            data: event,
            ledger: event.ledger,
            timestamp: new Date().toISOString(),
          });
        },
        onerror: (error: any) => {
          console.error('Event stream error:', error);
        },
      });

    return {
      unsubscribe: () => {
        if (eventStream && typeof eventStream === 'function') {
          eventStream();
        }
      },
    };
  }

  /**
   * Get contract data
   */
  async getContractData(contractId: string, key: string): Promise<any> {
    try {
      const ledgerKey = {
        contractData: {
          contract: contractId,
          key,
          durability: 'persistent' as const,
        },
      };

      const response = await this.sorobanServer.getLedgerEntries(ledgerKey);
      return response.entries?.[0]?.val;
    } catch (error) {
      throw new StellarError(
        'Failed to get contract data',
        ErrorCode.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Simulate a transaction before submission
   */
  async simulateTransaction(transaction: Transaction): Promise<any> {
    try {
      return await this.sorobanServer.simulateTransaction(transaction);
    } catch (error) {
      throw new StellarError(
        'Failed to simulate transaction',
        ErrorCode.NETWORK_ERROR,
        error
      );
    }
  }
}

// Export singleton instance
let sdkInstance: StellarSDK | null = null;

export function getStellarSDK(config?: StellarConfig): StellarSDK {
  if (!sdkInstance) {
    sdkInstance = new StellarSDK(config);
  }
  return sdkInstance;
}

export function resetStellarSDK(): void {
  sdkInstance = null;
}
