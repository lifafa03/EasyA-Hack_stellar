/**
 * Stellar Network Configuration
 * Provides network settings, Horizon URLs, and Soroban RPC endpoints
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarConfig } from './types';
import { getContractAddresses } from './contract-addresses';

export const STELLAR_CONFIG = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase: StellarSdk.Networks.TESTNET,
} as const;

// For production, switch to mainnet
export const getNetworkConfig = () => {
  if (STELLAR_CONFIG.network === 'mainnet') {
    return {
      ...STELLAR_CONFIG,
      horizonUrl: 'https://horizon.stellar.org',
      sorobanRpcUrl: 'https://soroban-mainnet.stellar.org',
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    };
  }
  return STELLAR_CONFIG;
};

/**
 * Get full Stellar configuration including contract addresses
 */
export function getStellarConfig(): StellarConfig {
  const networkConfig = getNetworkConfig();
  const contractIds = getContractAddresses(networkConfig.network as any);

  return {
    network: networkConfig.network as 'testnet' | 'mainnet',
    horizonUrl: networkConfig.horizonUrl,
    sorobanRpcUrl: networkConfig.sorobanRpcUrl,
    networkPassphrase: networkConfig.networkPassphrase,
    contractIds: {
      escrow: contractIds.escrow,
      pool: contractIds.crowdfunding,
      p2p: contractIds.p2p,
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: StellarConfig): void {
  if (!config.horizonUrl) {
    throw new Error('Horizon URL is required');
  }
  if (!config.sorobanRpcUrl) {
    throw new Error('Soroban RPC URL is required');
  }
  if (!config.networkPassphrase) {
    throw new Error('Network passphrase is required');
  }
}

export const USDC_ASSET = new StellarSdk.Asset(
  process.env.NEXT_PUBLIC_USDC_ASSET_CODE || 'USDC',
  process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
);

// Removed TrustlessWork - using direct Stellar escrow instead
