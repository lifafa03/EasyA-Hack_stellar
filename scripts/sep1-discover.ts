#!/usr/bin/env ts-node
/**
 * CHECKPOINT 3: SEP-1 Discovery
 * Discovers anchor endpoints via stellar.toml
 */

import toml from 'toml';

const ANCHOR_DOMAIN = process.env.ANCHOR_DOMAIN || 'testanchor.stellar.org';

async function discoverAnchor(domain?: string) {
  const anchorDomain = domain || ANCHOR_DOMAIN;
  
  console.log('🔍 CHECKPOINT 3: SEP-1 Anchor Discovery\\n');
  console.log('='.repeat(60));
  
  try {
    const tomlUrl = `https://${anchorDomain}/.well-known/stellar.toml`;
    
    console.log('📡 Fetching stellar.toml from:', anchorDomain);
    console.log('🔗 URL:', tomlUrl);
    console.log('');
    
    const response = await fetch(tomlUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const tomlText = await response.text();
    const tomlData = toml.parse(tomlText);
    
    console.log('✅ stellar.toml fetched successfully!');
    console.log('');
    console.log('📋 Anchor Information:');
    console.log(`  • Name: ${tomlData.DOCUMENTATION?.ORG_NAME || 'N/A'}`);
    console.log(`  • Version: ${tomlData.VERSION || 'N/A'}`);
    console.log('');
    console.log('🔐 SEP Endpoints:');
    console.log(`  • SEP-10 (Auth): ${tomlData.WEB_AUTH_ENDPOINT || '❌ Not found'}`);
    console.log(`  • SEP-24 (Interactive): ${tomlData.TRANSFER_SERVER_SEP0024 || '❌ Not found'}`);
    console.log(`  • SEP-6 (Deposit/Withdraw): ${tomlData.TRANSFER_SERVER || '❌ Not found'}`);
    console.log('');
    
    if (tomlData.CURRENCIES) {
      console.log('💱 Supported Assets:');
      tomlData.CURRENCIES.forEach((currency: any) => {
        const code = currency.code || '?';
        const issuer = currency.issuer || 'N/A';
        console.log(`  • ${code}: ${issuer.slice(0, 8)}...`);
      });
      console.log('');
    }
    
    // Validation
    const hasAuth = !!tomlData.WEB_AUTH_ENDPOINT;
    const hasSEP24 = !!tomlData.TRANSFER_SERVER_SEP0024;
    
    if (!hasAuth || !hasSEP24) {
      console.warn('⚠️  Warning: Missing required endpoints');
      if (!hasAuth) console.warn('  • WEB_AUTH_ENDPOINT (SEP-10) not found');
      if (!hasSEP24) console.warn('  • TRANSFER_SERVER_SEP0024 (SEP-24) not found');
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ CHECKPOINT 3 PASSED');
    console.log('='.repeat(60));
    
    return {
      webAuthEndpoint: tomlData.WEB_AUTH_ENDPOINT,
      transferServer: tomlData.TRANSFER_SERVER_SEP0024,
      currencies: tomlData.CURRENCIES
    };
    
  } catch (error: any) {
    console.error('');
    console.error('❌ CHECKPOINT 3 FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    
    console.error('');
    console.error('🔧 Diagnosis:');
    if (error.message?.includes('ENOTFOUND')) {
      console.error('  • Domain not found - check ANCHOR_DOMAIN');
      console.error(`  • Tried: ${anchorDomain}`);
    } else if (error.message?.includes('404')) {
      console.error('  • stellar.toml not found at domain');
      console.error('  • Anchor may not support SEP-1');
    } else {
      console.error('  • Unexpected error:', error);
    }
    
    console.error('='.repeat(60));
    process.exit(1);
  }
}

if (require.main === module) {
  const customDomain = process.argv[2];
  discoverAnchor(customDomain).catch(console.error);
}

export { discoverAnchor };
