/**
 * Stellar Wallet Integration
 * Main entry point for wallet functionality
 */

// Export types
export * from './types';

// Export wallet service
export { WalletService, WalletEventType } from './WalletService';
export type { WalletEventCallback } from './WalletService';

// Export wallet providers
export { FreighterProvider } from './providers/FreighterProvider';
export { LobstrProvider } from './providers/LobstrProvider';
export { AlbedoProvider } from './providers/AlbedoProvider';
export { xBullProvider } from './providers/xBullProvider';

// Create and export a default wallet service instance
import { WalletService } from './WalletService';
import { FreighterProvider } from './providers/FreighterProvider';
import { LobstrProvider } from './providers/LobstrProvider';
import { AlbedoProvider } from './providers/AlbedoProvider';
import { xBullProvider } from './providers/xBullProvider';

/**
 * Create a configured wallet service with all providers registered
 */
export function createWalletService(): WalletService {
  const service = new WalletService();

  // Register all wallet providers
  service.registerProvider(new FreighterProvider());
  service.registerProvider(new LobstrProvider());
  service.registerProvider(new AlbedoProvider());
  service.registerProvider(new xBullProvider());

  return service;
}

// Export a singleton instance for convenience
let walletServiceInstance: WalletService | null = null;

/**
 * Get the singleton wallet service instance
 */
export function getWalletService(): WalletService {
  if (!walletServiceInstance) {
    walletServiceInstance = createWalletService();
  }
  return walletServiceInstance;
}
