#!/usr/bin/env ts-node
/**
 * CHECKPOINT 1: Horizon Health Check
 * Verifies connection to Stellar Testnet and prints network info
 */

import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

async function checkHealth() {
  console.log('🏥 CHECKPOINT 1: Horizon Health Check\\n');
  console.log('='.repeat(60));
  
  try {
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    
    console.log('📡 Horizon URL:', HORIZON_URL);
    console.log('🌐 Network Passphrase:', NETWORK_PASSPHRASE);
    console.log('');
    
    console.log('⏳ Fetching latest ledger...');
    const ledgers = await server.ledgers().order('desc').limit(1).call();
    const latestLedger = ledgers.records[0];
    
    if (!latestLedger) {
      throw new Error('No ledger data received');
    }
    
    console.log('✅ Successfully connected to Horizon!');
    console.log('');
    console.log('📊 Latest Ledger Info:');
    console.log('  • Sequence:', latestLedger.sequence);
    console.log('  • Hash:', latestLedger.hash);
    console.log('  • Closed At:', latestLedger.closed_at);
    console.log('  • Successful Txs:', latestLedger.successful_transaction_count);
    console.log('  • Operations:', latestLedger.operation_count);
    console.log('');
    
    console.log('='.repeat(60));
    console.log('✅ CHECKPOINT 1 PASSED');
    console.log('🔗 Stellar Expert:', `https://stellar.expert/explorer/testnet`);
    console.log('='.repeat(60));
    
    return true;
    
  } catch (error: any) {
    console.error('');
    console.error('❌ CHECKPOINT 1 FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    
    console.error('');
    console.error('🔧 Diagnosis:');
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      console.error('  • Network connectivity issue');
      console.error('  • Check internet connection');
    } else if (error.message?.includes('timeout')) {
      console.error('  • Request timeout - try again');
    } else {
      console.error('  • Unexpected error:', error);
    }
    
    console.error('='.repeat(60));
    process.exit(1);
  }
}

if (require.main === module) {
  checkHealth().catch(console.error);
}

export { checkHealth };
