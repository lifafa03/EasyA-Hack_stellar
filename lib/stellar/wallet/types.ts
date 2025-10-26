/**
 * Wallet Provider Types and Interfaces
 * Defines the contract for all wallet provider implementations
 */

import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Supported wallet types
 */
export enum WalletType {
  LOBSTR = 'lobstr',
  FREIGHTER = 'freighter',
  ALBEDO = 'albedo',
  XBULL = 'xbull',
}

/**
 * Wallet connection state
 */
export interface WalletConnection {
  publicKey: string;
  walletType: WalletType;
  connectedAt: Date;
}

/**
 * Wallet provider interface
 * All wallet implementations must conform to this interface
 */
export interface WalletProvider {
  /**
   * Connect to the wallet and retrieve the public key
   * @returns The user's public key
   * @throws Error if connection fails or wallet is not available
   */
  connect(): Promise<string>;

  /**
   * Disconnect from the wallet
   */
  disconnect(): Promise<void>;

  /**
   * Sign a transaction using the connected wallet
   * @param transaction The transaction to sign
   * @param networkPassphrase The network passphrase for signing
   * @returns The signed transaction XDR
   * @throws Error if signing fails or user rejects
   */
  signTransaction(
    transaction: StellarSdk.Transaction,
    networkPassphrase: string
  ): Promise<string>;

  /**
   * Get the currently connected public key
   * @returns The public key or null if not connected
   */
  getPublicKey(): string | null;

  /**
   * Check if the wallet is available (installed/accessible)
   * @returns True if the wallet is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the wallet type
   */
  getWalletType(): WalletType;
}

/**
 * Wallet service state
 */
export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  provider: WalletProvider | null;
}

/**
 * Wallet error types
 */
export enum WalletErrorCode {
  NOT_INSTALLED = 'NOT_INSTALLED',
  USER_REJECTED = 'USER_REJECTED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  SIGNING_FAILED = 'SIGNING_FAILED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom wallet error class
 */
export class WalletError extends Error {
  constructor(
    message: string,
    public code: WalletErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'WalletError';
  }
}
