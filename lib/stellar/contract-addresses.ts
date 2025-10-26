/**
 * Stellar Smart Contract Addresses
 * 
 * This module manages contract addresses for different networks.
 * Contract addresses are loaded from environment variables.
 */

export interface ContractAddresses {
  escrow: string;
  crowdfunding: string;
  p2p: string;
}

export type StellarNetwork = 'testnet' | 'mainnet';

/**
 * Get contract addresses for the current network
 */
export function getContractAddresses(network?: StellarNetwork): ContractAddresses {
  const currentNetwork = network || (process.env.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetwork) || 'testnet';
  
  const addresses: ContractAddresses = {
    escrow: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || '',
    crowdfunding: process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID || '',
    p2p: process.env.NEXT_PUBLIC_P2P_CONTRACT_ID || '',
  };

  // Validate that all addresses are set
  const missingAddresses = Object.entries(addresses)
    .filter(([_, address]) => !address)
    .map(([name]) => name);

  if (missingAddresses.length > 0) {
    console.warn(
      `⚠️  Missing contract addresses for ${currentNetwork}: ${missingAddresses.join(', ')}\n` +
      'Please deploy contracts and update environment variables.'
    );
  }

  return addresses;
}

/**
 * Get a specific contract address
 */
export function getContractAddress(
  contractName: keyof ContractAddresses,
  network?: StellarNetwork
): string {
  const addresses = getContractAddresses(network);
  const address = addresses[contractName];

  if (!address) {
    throw new Error(
      `Contract address for "${contractName}" not found. ` +
      'Please deploy the contract and update environment variables.'
    );
  }

  return address;
}

/**
 * Check if all contracts are deployed
 */
export function areContractsDeployed(network?: StellarNetwork): boolean {
  const addresses = getContractAddresses(network);
  return Object.values(addresses).every(address => address.length > 0);
}

/**
 * Get contract explorer URL
 */
export function getContractExplorerUrl(
  contractAddress: string,
  network?: StellarNetwork
): string {
  const currentNetwork = network || (process.env.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetwork) || 'testnet';
  const networkPath = currentNetwork === 'mainnet' ? 'public' : 'testnet';
  
  return `https://stellar.expert/explorer/${networkPath}/contract/${contractAddress}`;
}
