/**
 * TypeScript types and interfaces for Stellar integration
 */

import { Networks, Transaction, Server } from '@stellar/stellar-sdk';

// Network configuration types
export type NetworkType = 'testnet' | 'mainnet';

export interface StellarConfig {
  network: NetworkType;
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
  contractIds: ContractIds;
}

export interface ContractIds {
  escrow?: string;
  pool?: string;
  p2p?: string;
}

// Transaction types
export interface TransactionResult {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  ledger?: number;
  createdAt: string;
}

export interface TransactionOptions {
  fee?: string;
  timeout?: number;
}

// Error types
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  ANCHOR_ERROR = 'ANCHOR_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  USER_REJECTED = 'USER_REJECTED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}

export class StellarError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'StellarError';
  }
}

// Event types
export type EventCallback = (event: ContractEvent) => void;

export interface ContractEvent {
  type: string;
  contractId: string;
  data: any;
  ledger: number;
  timestamp: string;
}

export interface Subscription {
  unsubscribe: () => void;
}

// Signer interface
export interface Signer {
  sign: (transaction: Transaction) => Promise<Transaction>;
  getPublicKey: () => string;
}
