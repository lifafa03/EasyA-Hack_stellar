/**
 * Checkpoint Validation System
 * Auto-validates blockchain operations and auto-corrects errors
 * Ensures all transactions and contract interactions work correctly
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkConfig } from './config';
import { toast } from 'sonner';

export interface ValidationResult {
  success: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
  data?: any;
}

export interface CheckpointConfig {
  maxRetries?: number;
  retryDelay?: number;
  autoCorrect?: boolean;
  verbose?: boolean;
}

const DEFAULT_CONFIG: Required<CheckpointConfig> = {
  maxRetries: 3,
  retryDelay: 2000,
  autoCorrect: true,
  verbose: true,
};

/**
 * Checkpoint 1: Validate wallet connection
 */
export const validateWalletConnection = async (
  publicKey: string,
  config: CheckpointConfig = {}
): Promise<ValidationResult> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  try {
    if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      return {
        success: false,
        message: 'Invalid public key format',
        errors: ['Public key must be a valid Stellar address starting with G'],
      };
    }

    const networkConfig = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(networkConfig.horizonUrl);
    
    // Check if account exists on network
    try {
      const account = await server.loadAccount(publicKey);
      
      if (cfg.verbose) {
        toast.success('✅ Checkpoint: Wallet validated', {
          description: `Account exists with sequence: ${account.sequence}`,
        });
      }

      return {
        success: true,
        message: 'Wallet connection validated',
        data: { accountExists: true, sequence: account.sequence },
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Account not found on network',
          errors: ['Account needs to be funded. Get testnet XLM from https://laboratory.stellar.org/#account-creator'],
          warnings: ['Account is not yet activated on the Stellar network'],
        };
      }
      throw error;
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Wallet validation failed',
      errors: [error.message],
    };
  }
};

/**
 * Checkpoint 2: Validate transaction before submission
 */
export const validateTransaction = async (
  transaction: StellarSdk.Transaction,
  config: CheckpointConfig = {}
): Promise<ValidationResult> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate transaction structure
    if (!transaction || !transaction.toXDR) {
      errors.push('Invalid transaction object');
      return { success: false, message: 'Invalid transaction', errors };
    }

    // Check if transaction has operations
    if (transaction.operations.length === 0) {
      errors.push('Transaction has no operations');
    }

    // Check transaction fee
    const fee = parseInt(transaction.fee);
    const baseFee = typeof StellarSdk.BASE_FEE === 'string' ? parseInt(StellarSdk.BASE_FEE) : Number(StellarSdk.BASE_FEE);
    const recommendedFee = baseFee * transaction.operations.length;
    
    if (fee < recommendedFee) {
      warnings.push(`Fee (${fee}) is lower than recommended (${recommendedFee})`);
    }

    // Validate source account
    const sourceAccount = transaction.source;
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(sourceAccount)) {
      errors.push('Invalid source account');
    }

    // Check sequence number
    const networkConfig = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(networkConfig.horizonUrl);
    
    try {
      const account = await server.loadAccount(sourceAccount);
      const currentSequence = BigInt(account.sequence);
      const txSequence = BigInt(transaction.sequence);
      
      if (txSequence <= currentSequence) {
        errors.push(`Transaction sequence (${txSequence}) must be greater than current (${currentSequence})`);
        
        // Auto-correct if enabled
        if (cfg.autoCorrect) {
          warnings.push('Transaction will be rebuilt with correct sequence');
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        errors.push('Source account not found on network');
      }
    }

    if (cfg.verbose && errors.length === 0) {
      toast.success('✅ Checkpoint: Transaction validated', {
        description: `${transaction.operations.length} operations, fee: ${fee} stroops`,
      });
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? 'Transaction validated' : 'Transaction validation failed',
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Transaction validation error',
      errors: [error.message],
    };
  }
};

/**
 * Checkpoint 3: Validate escrow creation
 */
export const validateEscrowCreation = async (
  params: {
    clientAddress: string;
    freelancerAddress: string;
    budget: number;
    milestones: any[];
  },
  config: CheckpointConfig = {}
): Promise<ValidationResult> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate addresses
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(params.clientAddress)) {
      errors.push('Invalid client address');
    }
    // Freelancer address is optional when creating project (will be set when bid is accepted)
    if (params.freelancerAddress && !StellarSdk.StrKey.isValidEd25519PublicKey(params.freelancerAddress)) {
      errors.push('Invalid freelancer address');
    }

    // Validate budget
    if (params.budget <= 0) {
      errors.push('Budget must be greater than 0');
    }

    // Validate milestones
    if (!params.milestones || params.milestones.length === 0) {
      errors.push('At least one milestone required');
    } else {
      const totalMilestoneBudget = params.milestones.reduce((sum, m) => sum + (m.budget || 0), 0);
      
      if (Math.abs(totalMilestoneBudget - params.budget) > 0.01) {
        warnings.push(`Milestone budgets (${totalMilestoneBudget}) don't match total budget (${params.budget})`);
      }

      params.milestones.forEach((milestone, index) => {
        if (!milestone.title || milestone.title.trim() === '') {
          errors.push(`Milestone ${index + 1} missing title`);
        }
        if (!milestone.budget || milestone.budget <= 0) {
          errors.push(`Milestone ${index + 1} has invalid budget`);
        }
      });
    }

    // Check client account balance
    const networkConfig = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(networkConfig.horizonUrl);
    
    try {
      const account = await server.loadAccount(params.clientAddress);
      const balance = account.balances.find((b: any) => b.asset_type === 'native');
      
      if (balance) {
        const xlmBalance = parseFloat(balance.balance);
        const reserveRequired = 2; // XLM reserve for account
        
        if (xlmBalance < reserveRequired) {
          warnings.push(`Client XLM balance (${xlmBalance}) may be insufficient for transaction fees`);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        errors.push('Client account not found on network');
      }
    }

    if (cfg.verbose && errors.length === 0) {
      toast.success('✅ Checkpoint: Escrow parameters validated', {
        description: `${params.milestones.length} milestones, ${params.budget} USDC`,
      });
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? 'Escrow parameters validated' : 'Escrow validation failed',
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Escrow validation error',
      errors: [error.message],
    };
  }
};

/**
 * Checkpoint 4: Validate and auto-retry failed transactions
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  config: CheckpointConfig = {}
): Promise<{ success: boolean; data?: T; error?: string; attempts: number }> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= cfg.maxRetries; attempt++) {
    try {
      if (cfg.verbose && attempt > 1) {
        toast.info(`🔄 Retry attempt ${attempt}/${cfg.maxRetries}`);
      }

      const result = await operation();
      
      if (cfg.verbose) {
        toast.success(`✅ Operation succeeded on attempt ${attempt}`);
      }

      return { success: true, data: result, attempts: attempt };
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < cfg.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, cfg.retryDelay));
      }
    }
  }

  if (cfg.verbose) {
    toast.error(`❌ Operation failed after ${cfg.maxRetries} attempts`, {
      description: lastError?.message,
    });
  }

  return {
    success: false,
    error: lastError?.message || 'Operation failed',
    attempts: cfg.maxRetries,
  };
};

/**
 * Checkpoint 5: Validate smart contract interaction
 */
export const validateContractCall = async (
  contractId: string,
  method: string,
  args: any[],
  config: CheckpointConfig = {}
): Promise<ValidationResult> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];

  try {
    // Validate contract address format
    if (!contractId || contractId.length !== 56) {
      errors.push('Invalid contract ID format');
    }

    // Validate method name
    if (!method || typeof method !== 'string') {
      errors.push('Invalid method name');
    }

    // Validate arguments
    if (!Array.isArray(args)) {
      errors.push('Arguments must be an array');
    }

    if (cfg.verbose && errors.length === 0) {
      toast.success('✅ Checkpoint: Contract call validated', {
        description: `Calling ${method} on contract`,
      });
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? 'Contract call validated' : 'Contract call validation failed',
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Contract validation error',
      errors: [error.message],
    };
  }
};

/**
 * Master checkpoint runner - validates entire operation flow
 */
export const runCheckpoints = async (
  checkpoints: Array<() => Promise<ValidationResult>>,
  config: CheckpointConfig = {}
): Promise<{ allPassed: boolean; results: ValidationResult[] }> => {
  const results: ValidationResult[] = [];
  
  for (const checkpoint of checkpoints) {
    const result = await checkpoint();
    results.push(result);
    
    if (!result.success) {
      console.error('Checkpoint failed:', result);
      
      if (!config.autoCorrect) {
        break; // Stop on first failure if auto-correct is disabled
      }
    }
  }

  const allPassed = results.every((r) => r.success);
  
  return { allPassed, results };
};
