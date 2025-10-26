/**
 * Stellar Network Configuration
 * Provides network settings, Horizon URLs, and Soroban RPC endpoints
 */

import * as StellarSdk from '@stellar/stellar-sdk';

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

export const USDC_ASSET = new StellarSdk.Asset(
  process.env.NEXT_PUBLIC_USDC_ASSET_CODE || 'USDC',
  process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
);

export const TRUSTLESS_WORK_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_TRUSTLESS_WORK_API || 'https://api.trustlesswork.com',
  contractId: process.env.NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT || '',
};
