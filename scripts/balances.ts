#!/usr/bin/env ts-node
/**
 * CHECKPOINT 2: Check Account Balances
 * Displays current XLM and USDC balances
 */

import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const USER_PUBLIC_KEY = process.env.USER_PUBLIC_KEY || 'GCKVBXQ2IEO62OV3QIOANZFZSJRZKPJEZ5QJLUBZEV5EQZVPHPQSXUOV';
const USDC_ISSUER = process.env.USDC_ISSUER_TESTNET || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

async function checkBalances(accountId?: string) {
  const address = accountId || USER_PUBLIC_KEY;
  
  console.log('💰 CHECKPOINT 2: Account Balances\\n');
  console.log('='.repeat(60));
  
  try {
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    
    console.log('📍 Account:', address);
    console.log('');
    
    const account = await server.loadAccount(address);
    
    console.log('✅ Account found on-chain!');
    console.log('');
    console.log('💵 Balances:');
    
    let hasXLM = false;
    let hasUSDC = false;
    
    account.balances.forEach((balance: any) => {
      if (balance.asset_type === 'native') {
        hasXLM = true;
        console.log(`  • XLM: ${parseFloat(balance.balance).toFixed(7)}`);
      } else if (balance.asset_code === 'USDC' && balance.asset_issuer === USDC_ISSUER) {
        hasUSDC = true;
        console.log(`  • USDC: ${parseFloat(balance.balance).toFixed(7)}`);
        console.log(`    Issuer: ${balance.asset_issuer?.slice(0, 8)}...`);
      } else {
        console.log(`  • ${balance.asset_code}: ${parseFloat(balance.balance).toFixed(7)}`);
      }
    });
    
    console.log('');
    console.log('🔍 Status:');
    console.log(`  • Has XLM: ${hasXLM ? '✅' : '❌'}`);
    console.log(`  • Has USDC Trustline: ${hasUSDC ? '✅' : '❌'}`);
    
    if (!hasUSDC) {
      console.log('');
      console.log('⚠️  USDC trustline not found!');
      console.log('📝 You need to add USDC trustline before swapping.');
      console.log('🔗 USDC Issuer:', USDC_ISSUER);
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ CHECKPOINT 2 PASSED');
    console.log('🔗 View Account:', `https://stellar.expert/explorer/testnet/account/${address}`);
    console.log('='.repeat(60));
    
    return {
      xlm: account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0',
      usdc: account.balances.find((b: any) => b.asset_code === 'USDC')?.balance || '0',
      hasUSDCTrustline: hasUSDC
    };
    
  } catch (error: any) {
    console.error('');
    console.error('❌ CHECKPOINT 2 FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    
    if (error.response?.status === 404) {
      console.error('');
      console.error('🔧 Account not found on testnet!');
      console.error('💡 Fund via Friendbot:', `https://friendbot.stellar.org?addr=${address}`);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  const customAddress = process.argv[2];
  checkBalances(customAddress).catch(console.error);
}

export { checkBalances };
