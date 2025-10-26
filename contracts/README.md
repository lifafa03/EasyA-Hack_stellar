# Stellar Smart Contracts

This directory contains Soroban smart contracts for the marketplace platform.

## Contracts

### 1. Escrow Contract (`contracts/escrow`)
Manages milestone-based and time-based payment releases for project work.

**Key Features:**
- Initialize escrow with client, provider, and amount
- Support for milestone-based releases
- Support for time-based releases
- Dispute resolution mechanism
- Secure fund withdrawal

### 2. Crowdfunding Contract (`contracts/crowdfunding`)
Handles multi-investor funding pools for projects.

**Key Features:**
- Create funding pools with goals and deadlines
- Accept contributions from multiple investors
- Automatic finalization when goal is met
- Refund mechanism for failed pools
- Real-time contribution tracking

### 3. P2P Transaction Contract (`contracts/p2p`)
Facilitates direct peer-to-peer payments with optional escrow protection.

**Key Features:**
- Direct instant transfers
- Escrow-protected transfers
- Receiver confirmation mechanism
- Transaction cancellation

## Prerequisites

1. **Rust and Cargo**: Install from [rustup.rs](https://rustup.rs/)
2. **wasm32 target**: 
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
3. **Stellar CLI**: Install from [Stellar Docs](https://developers.stellar.org/docs/tools/developer-tools)
4. **Stellar Account**: Create a testnet account using Stellar Laboratory

## Building Contracts

Build all contracts:
```bash
# Build escrow contract
cd contracts/escrow
cargo build --target wasm32-unknown-unknown --release

# Build crowdfunding contract
cd contracts/crowdfunding
cargo build --target wasm32-unknown-unknown --release

# Build P2P contract
cd contracts/p2p
cargo build --target wasm32-unknown-unknown --release
```

The compiled WASM files will be in `target/wasm32-unknown-unknown/release/`.

## Deployment

### Testnet Deployment

1. **Set up your Stellar account**:
   ```bash
   # Generate a new keypair (if needed)
   stellar keys generate testnet-deployer --network testnet
   
   # Fund your account from the friendbot
   stellar keys fund testnet-deployer --network testnet
   ```

2. **Set environment variable**:
   ```bash
   export STELLAR_ACCOUNT=testnet-deployer
   ```

3. **Run deployment script**:
   ```bash
   ./scripts/stellar/deploy-testnet.sh
   ```

4. **Verify deployment**:
   ```bash
   ./scripts/stellar/verify-deployment.sh .env.testnet
   ```

### Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment uses real funds and deploys production contracts.

**Before deploying to mainnet:**
- [ ] Contracts have been professionally audited
- [ ] Extensive testing completed on testnet
- [ ] Security review completed
- [ ] Team approval obtained

1. **Set up mainnet account**:
   ```bash
   stellar keys generate mainnet-deployer --network mainnet
   # Fund this account with real XLM
   ```

2. **Set environment variable**:
   ```bash
   export STELLAR_ACCOUNT=mainnet-deployer
   ```

3. **Run deployment script**:
   ```bash
   ./scripts/stellar/deploy-mainnet.sh
   ```

4. **Verify deployment**:
   ```bash
   ./scripts/stellar/verify-deployment.sh .env.mainnet
   ```

## Environment Configuration

After deployment, contract addresses are saved to `.env.testnet` or `.env.mainnet`:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

NEXT_PUBLIC_ESCROW_CONTRACT_ID=C...
NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ID=C...
NEXT_PUBLIC_P2P_CONTRACT_ID=C...
```

Copy the appropriate file to `.env.local` for your application:
```bash
cp .env.testnet .env.local
```

## Testing Contracts

### Unit Tests

Run contract tests:
```bash
cd contracts/escrow
cargo test

cd contracts/crowdfunding
cargo test

cd contracts/p2p
cargo test
```

### Integration Testing

Use the Stellar CLI to interact with deployed contracts:

```bash
# Example: Get escrow status
stellar contract invoke \
  --id <ESCROW_CONTRACT_ID> \
  --source <YOUR_ACCOUNT> \
  --network testnet \
  -- get_status
```

## Contract Interaction

### Using TypeScript SDK

```typescript
import { getContractAddress } from '@/lib/stellar/contract-addresses';
import { EscrowService } from '@/lib/stellar/services/escrow';

// Get contract address
const escrowAddress = getContractAddress('escrow');

// Initialize service
const escrowService = new EscrowService(stellarSDK);

// Create escrow
await escrowService.createEscrow({
  provider: 'G...',
  totalAmount: '1000',
  releaseType: 'milestone-based',
  milestones: [
    { id: 1, description: 'Phase 1', amount: '500' },
    { id: 2, description: 'Phase 2', amount: '500' }
  ]
});
```

## Monitoring

### Stellar Expert

View contracts on Stellar Expert:
- Testnet: `https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>`
- Mainnet: `https://stellar.expert/explorer/public/contract/<CONTRACT_ID>`

### Event Monitoring

Contracts emit events for important state changes:
- `init`: Contract initialization
- `complete`: Milestone completion
- `release`: Time-based release
- `withdraw`: Fund withdrawal
- `dispute`: Dispute initiated
- `contrib`: Pool contribution
- `finalize`: Pool finalization
- `refund`: Refund processed

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

### Deployment Errors

Common issues:
- **Insufficient funds**: Fund your account from friendbot (testnet) or add XLM (mainnet)
- **Network timeout**: Check RPC URL and network connectivity
- **Invalid account**: Verify account name with `stellar keys list`

### Contract Interaction Errors

- **Not initialized**: Contract must be initialized before use
- **Unauthorized**: Ensure correct account is signing transactions
- **Invalid amount**: Check amount is positive and within limits

## Security Considerations

1. **Access Control**: Only authorized parties can trigger sensitive operations
2. **Input Validation**: All inputs are validated before state changes
3. **Reentrancy Protection**: Contracts use checks-effects-interactions pattern
4. **Error Handling**: Comprehensive error types for all failure scenarios
5. **Event Emissions**: All state changes emit events for transparency

## Upgrading Contracts

Soroban contracts are immutable once deployed. To upgrade:

1. Deploy new contract version
2. Update contract addresses in environment variables
3. Migrate data if necessary
4. Update application to use new contract

## Resources

- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar CLI Reference](https://developers.stellar.org/docs/tools/developer-tools)
- [Soroban Examples](https://github.com/stellar/soroban-examples)
- [Stellar Expert](https://stellar.expert/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Soroban documentation
3. Ask in Stellar Discord
4. Open an issue in the repository
