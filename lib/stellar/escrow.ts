/**
 * Simple Stellar Escrow System
 * Direct USDC escrow without external dependencies
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { signAndSubmitTransaction, WalletType } from './wallet';
import { STELLAR_CONFIG, USDC_ASSET } from './config';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Milestone {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  deliverables?: string[];
  completedAt?: number;
}

export interface EscrowParams {
  clientAddress: string;
  freelancerAddress?: string;
  totalBudget: number;
  milestones: Milestone[];
  projectId: string;
}

export interface EscrowResult {
  escrowId: string;
  escrowAddress: string;
  transactionHash: string;
  ledger: number;
}

// ============================================================================
// Escrow Functions
// ============================================================================

/**
 * Create a simple escrow by sending USDC to a new escrow account
 * In production, this would use Stellar smart contracts (Soroban)
 */
export const createEscrow = async (
  params: EscrowParams,
  walletType: WalletType = 'freighter'
): Promise<EscrowResult> => {
  try {
    // Validate parameters
    if (!params.clientAddress) {
      throw new Error('Client address is required');
    }
    if (!params.totalBudget || params.totalBudget <= 0) {
      throw new Error('Total budget must be greater than 0');
    }
    if (!params.milestones || params.milestones.length === 0) {
      throw new Error('At least one milestone is required');
    }

    // Validate milestone budgets sum to total
    const milestoneSum = params.milestones.reduce((sum, m) => sum + m.budget, 0);
    if (Math.abs(milestoneSum - params.totalBudget) > 0.01) {
      throw new Error(`Milestone budgets (${milestoneSum}) must equal total budget (${params.totalBudget})`);
    }

    const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);

    // Create a new keypair for the escrow account
    const escrowKeypair = StellarSdk.Keypair.random();
    const escrowAddress = escrowKeypair.publicKey();

    // Load the client account
    const clientAccount = await server.loadAccount(params.clientAddress);

    // Build transaction to:
    // 1. Create escrow account
    // 2. Fund it with USDC
    // 3. Add memo with project details
    const transaction = new StellarSdk.TransactionBuilder(clientAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      // Create the escrow account with minimum XLM balance
      .addOperation(
        StellarSdk.Operation.createAccount({
          destination: escrowAddress,
          startingBalance: '2.5', // Minimum balance for account + trustline
        })
      )
      // Add trustline for USDC to escrow account
      .addOperation(
        StellarSdk.Operation.changeTrust({
          source: escrowAddress,
          asset: new StellarSdk.Asset(USDC_ASSET.code, USDC_ASSET.issuer),
        })
      )
      // Send USDC to escrow account
      .addOperation(
        StellarSdk.Operation.payment({
          destination: escrowAddress,
          asset: new StellarSdk.Asset(USDC_ASSET.code, USDC_ASSET.issuer),
          amount: params.totalBudget.toFixed(7),
        })
      )
      // Add memo with project ID
      .addMemo(StellarSdk.Memo.text('Escrow'))
      .setTimeout(180)
      .build();

    // Sign with escrow account (for trustline operation)
    transaction.sign(escrowKeypair);

    // Sign and submit with client wallet
    const result = await signAndSubmitTransaction(transaction, walletType);

    // Generate escrow ID
    const escrowId = `escrow-${params.projectId}-${Date.now()}`;

    // Store escrow details in localStorage
    const escrowData = {
      escrowId,
      escrowAddress,
      clientAddress: params.clientAddress,
      freelancerAddress: params.freelancerAddress,
      totalBudget: params.totalBudget,
      releasedAmount: 0,
      milestones: params.milestones,
      projectId: params.projectId,
      status: 'active',
      createdAt: Date.now(),
      transactionHash: result.hash,
    };

    localStorage.setItem(escrowId, JSON.stringify(escrowData));

    return {
      escrowId,
      escrowAddress,
      transactionHash: result.hash,
      ledger: result.ledger || 0,
    };
  } catch (error: any) {
    console.error('Escrow creation error:', error);
    throw new Error(error.message || 'Failed to create escrow');
  }
};

/**
 * Release funds from escrow to freelancer
 * In production, this would be controlled by smart contract logic
 */
export const releaseMilestone = async (
  escrowId: string,
  milestoneId: string,
  walletType: WalletType = 'freighter'
): Promise<{ transactionHash: string }> => {
  try {
    // Load escrow data
    const escrowDataStr = localStorage.getItem(escrowId);
    if (!escrowDataStr) {
      throw new Error('Escrow not found');
    }

    const escrowData = JSON.parse(escrowDataStr);
    
    // Find milestone
    const milestone = escrowData.milestones.find((m: Milestone) => m.id === milestoneId);
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    if (milestone.status === 'approved') {
      throw new Error('Milestone already released');
    }

    if (!escrowData.freelancerAddress) {
      throw new Error('No freelancer assigned to this escrow');
    }

    const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);

    // In a real implementation, the escrow account would be controlled by a smart contract
    // For this demo, we'll simulate the release by having the client send from their account
    const clientAccount = await server.loadAccount(escrowData.clientAddress);

    const transaction = new StellarSdk.TransactionBuilder(clientAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: escrowData.freelancerAddress,
          asset: new StellarSdk.Asset(USDC_ASSET.code, USDC_ASSET.issuer),
          amount: milestone.budget.toFixed(7),
        })
      )
      .addMemo(StellarSdk.Memo.text('Milestone Release'))
      .setTimeout(180)
      .build();

    const result = await signAndSubmitTransaction(transaction, walletType);

    // Update escrow data
    milestone.status = 'approved';
    milestone.completedAt = Date.now();
    escrowData.releasedAmount += milestone.budget;
    
    if (escrowData.releasedAmount >= escrowData.totalBudget) {
      escrowData.status = 'completed';
    }

    localStorage.setItem(escrowId, JSON.stringify(escrowData));

    return {
      transactionHash: result.hash,
    };
  } catch (error: any) {
    console.error('Milestone release error:', error);
    throw new Error(error.message || 'Failed to release milestone');
  }
};

/**
 * Get escrow status
 */
export const getEscrowStatus = (escrowId: string) => {
  const escrowDataStr = localStorage.getItem(escrowId);
  if (!escrowDataStr) {
    return null;
  }
  return JSON.parse(escrowDataStr);
};

/**
 * Fund a project (for investors/backers)
 * Creates a USDC payment transaction on Stellar testnet
 * In production, this would send to an escrow smart contract
 */
export const fundEscrow = async (
  escrowId: string,
  amount: string,
  funderAddress: string,
  walletType: WalletType = 'freighter'
): Promise<{ success: boolean; transactionHash: string }> => {
  try {
    const fundAmount = parseFloat(amount);
    if (fundAmount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
    const funderAccount = await server.loadAccount(funderAddress);

    // For demo: Create a claimable balance that represents the funding
    // In production, this would send to an escrow smart contract
    const transaction = new StellarSdk.TransactionBuilder(funderAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.createClaimableBalance({
          asset: new StellarSdk.Asset(USDC_ASSET.code, USDC_ASSET.issuer),
          amount: fundAmount.toFixed(7),
          claimants: [
            // In production, this would be the escrow contract
            // For demo, we make it claimable by the funder (so they can reclaim if needed)
            new StellarSdk.Claimant(
              funderAddress,
              StellarSdk.Claimant.predicateUnconditional()
            ),
          ],
        })
      )
      .addMemo(StellarSdk.Memo.text(`Fund:${escrowId.substring(0, 15)}`))
      .setTimeout(180)
      .build();

    const result = await signAndSubmitTransaction(transaction, walletType);

    // Store funding record in localStorage
    const fundingKey = `funding-${escrowId}-${Date.now()}`;
    const fundingRecord = {
      escrowId,
      funderAddress,
      amount: fundAmount,
      timestamp: Date.now(),
      transactionHash: result.hash,
    };
    localStorage.setItem(fundingKey, JSON.stringify(fundingRecord));

    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error: any) {
    console.error('Fund escrow error:', error);
    throw new Error(error.message || 'Failed to fund project');
  }
};

/**
 * Withdraw available funds (for freelancer)
 * In production, this would interact with a Soroban smart contract
 * For testnet demo, we simulate the withdrawal with a claimable balance
 */
export const withdrawFunds = async (
  escrowId: string,
  freelancerAddress: string,
  walletType: WalletType = 'freighter'
): Promise<{ transactionHash: string }> => {
  try {
    const escrowData = getEscrowStatus(escrowId);
    if (!escrowData) {
      throw new Error('Escrow not found');
    }

    if (escrowData.freelancerAddress && escrowData.freelancerAddress !== freelancerAddress) {
      throw new Error('Only the assigned freelancer can withdraw');
    }

    const availableAmount = escrowData.releasedAmount;
    if (availableAmount <= 0) {
      throw new Error('No funds available to withdraw');
    }

    const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
    
    // For testnet demo: Create a claimable balance that the freelancer can claim
    // In production, this would call a Soroban smart contract that controls the escrow
    const clientAccount = await server.loadAccount(escrowData.clientAddress);

    const transaction = new StellarSdk.TransactionBuilder(clientAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.createClaimableBalance({
          asset: new StellarSdk.Asset(USDC_ASSET.code, USDC_ASSET.issuer),
          amount: availableAmount.toFixed(7),
          claimants: [
            new StellarSdk.Claimant(
              freelancerAddress,
              StellarSdk.Claimant.predicateUnconditional()
            ),
          ],
        })
      )
      .addMemo(StellarSdk.Memo.text('Escrow Release'))
      .setTimeout(180)
      .build();

    const result = await signAndSubmitTransaction(transaction, walletType);

    // Update escrow
    escrowData.releasedAmount = 0;
    escrowData.lastWithdrawal = {
      amount: availableAmount,
      transactionHash: result.hash,
      timestamp: Date.now(),
    };
    localStorage.setItem(escrowId, JSON.stringify(escrowData));

    return {
      transactionHash: result.hash,
    };
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    throw new Error(error.message || 'Failed to withdraw funds');
  }
};
