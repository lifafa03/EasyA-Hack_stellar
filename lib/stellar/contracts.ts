/**
 * Smart Contract Utilities
 * Handles Soroban smart contract interactions
 * Provides utilities for contract deployment and invocation
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkConfig } from './config';
import { signAndSubmitTransaction, WalletType } from './wallet';

export interface ContractCallParams {
  contractId: string;
  method: string;
  args: any[];
  sourcePublicKey: string;
}

/**
 * Invoke a smart contract function
 */
export const invokeContract = async (
  params: ContractCallParams,
  walletType: WalletType = 'freighter'
): Promise<any> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    const account = await server.loadAccount(params.sourcePublicKey);

    // Build contract invocation transaction
    const contract = new StellarSdk.Contract(params.contractId);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        contract.call(params.method, ...params.args)
      )
      .setTimeout(180)
      .build();

    // Sign and submit
    const result = await signAndSubmitTransaction(transaction, walletType);
    return result;
  } catch (error) {
    console.error('Error invoking contract:', error);
    throw error;
  }
};

/**
 * Read contract state (view function)
 */
export const readContractData = async (
  contractId: string,
  key: string
): Promise<any> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);

    // Use Soroban RPC to read contract data
    const response = await fetch(config.sorobanRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getLedgerEntries',
        params: {
          keys: [
            StellarSdk.xdr.LedgerKey.contractData(
              new StellarSdk.xdr.LedgerKeyContractData({
                contract: StellarSdk.Address.fromString(contractId).toScAddress(),
                key: StellarSdk.nativeToScVal(key),
                durability: StellarSdk.xdr.ContractDataDurability.persistent(),
              })
            ).toXDR('base64'),
          ],
        },
      }),
    });

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error reading contract data:', error);
    throw error;
  }
};

/**
 * Get escrow contract details
 */
export const getEscrowContractDetails = async (contractAddress: string): Promise<any> => {
  try {
    // Read various escrow properties
    const [status, balance, milestones] = await Promise.all([
      readContractData(contractAddress, 'status'),
      readContractData(contractAddress, 'balance'),
      readContractData(contractAddress, 'milestones'),
    ]);

    return {
      status,
      balance,
      milestones,
      contractAddress,
    };
  } catch (error) {
    console.error('Error fetching escrow contract details:', error);
    throw error;
  }
};

/**
 * Simulate contract execution (for testing)
 */
export const simulateContract = async (
  transaction: StellarSdk.Transaction
): Promise<any> => {
  try {
    const config = getNetworkConfig();
    
    const response = await fetch(config.sorobanRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'simulateTransaction',
        params: {
          transaction: transaction.toXDR(),
        },
      }),
    });

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error simulating contract:', error);
    throw error;
  }
};

/**
 * Deploy a new smart contract
 */
export const deployContract = async (
  wasmHash: string,
  sourcePublicKey: string,
  walletType: WalletType = 'freighter'
): Promise<{ contractId: string; transaction: any }> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    const account = await server.loadAccount(sourcePublicKey);

    // Create contract deployment transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.createCustomContract({
          wasmHash: Buffer.from(wasmHash, 'hex'),
          address: new StellarSdk.Address(sourcePublicKey),
        })
      )
      .setTimeout(180)
      .build();

    const result = await signAndSubmitTransaction(transaction, walletType);

    // Extract contract ID from result
    const contractId = extractContractId(result);

    return {
      contractId,
      transaction: result,
    };
  } catch (error) {
    console.error('Error deploying contract:', error);
    throw error;
  }
};

/**
 * Extract contract ID from deployment transaction result
 */
function extractContractId(txResult: any): string {
  try {
    // Parse transaction result to get contract ID
    // This is a simplified version - actual implementation depends on transaction structure
    const resultMeta = txResult.result_meta_xdr;
    // TODO: Parse XDR to extract contract address
    return 'CONTRACT_ID_PLACEHOLDER';
  } catch (error) {
    console.error('Error extracting contract ID:', error);
    throw error;
  }
}

/**
 * Monitor contract events
 */
export const monitorContractEvents = async (
  contractId: string,
  startLedger?: number
): Promise<any[]> => {
  try {
    const config = getNetworkConfig();
    
    const response = await fetch(config.sorobanRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getEvents',
        params: {
          startLedger,
          filters: [
            {
              type: 'contract',
              contractIds: [contractId],
            },
          ],
        },
      }),
    });

    const data = await response.json();
    return data.result.events || [];
  } catch (error) {
    console.error('Error monitoring contract events:', error);
    return [];
  }
};
