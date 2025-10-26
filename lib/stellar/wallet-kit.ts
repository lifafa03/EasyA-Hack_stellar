/**
 * Stellar Wallets Kit Configuration
 * Configures the Stellar Wallets Kit with supported wallets
 */

import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID, XBULL_ID } from '@creit.tech/stellar-wallets-kit';

// Network configuration
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';

// Map network names to WalletNetwork enum
const getWalletNetwork = (): WalletNetwork => {
  switch (NETWORK) {
    case 'mainnet':
    case 'public':
      return WalletNetwork.PUBLIC;
    case 'testnet':
      return WalletNetwork.TESTNET;
    case 'futurenet':
      return WalletNetwork.FUTURENET;
    case 'standalone':
      return WalletNetwork.STANDALONE;
    default:
      return WalletNetwork.TESTNET;
  }
};

// Create and configure the kit instance
let kitInstance: StellarWalletsKit | null = null;

export const getWalletKit = (): StellarWalletsKit => {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      network: getWalletNetwork(),
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }
  return kitInstance;
};

// Export network configuration for use in other parts of the app
export const walletKitConfig = {
  network: NETWORK,
  networkPassphrase: NETWORK_PASSPHRASE,
  horizonUrl: HORIZON_URL,
  rpcUrl: RPC_URL,
  walletNetwork: getWalletNetwork(),
};

// Helper to get public key from kit
export const getPublicKey = async (kit: StellarWalletsKit): Promise<string | null> => {
  try {
    const { address } = await kit.getAddress();
    return address;
  } catch (error) {
    console.error('Failed to get public key:', error);
    return null;
  }
};

// Helper to sign transaction
export const signTransaction = async (
  kit: StellarWalletsKit,
  xdr: string,
  opts?: {
    networkPassphrase?: string;
    address?: string;
  }
): Promise<string> => {
  const { signedTxXdr } = await kit.signTransaction(xdr, {
    networkPassphrase: opts?.networkPassphrase || NETWORK_PASSPHRASE,
    address: opts?.address,
  });
  return signedTxXdr;
};
