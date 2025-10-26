# Design Document: Stellar Smart Contracts Integration

## Overview

This design outlines the integration of Soroban smart contracts into the marketplace platform to enable secure escrow transactions, crowdfunding pools, and seamless fiat on/off-ramping. The system will leverage Stellar's blockchain infrastructure to provide a decentralized, trustless marketplace experience.

The architecture consists of three main layers:
1. **Smart Contract Layer**: Soroban contracts deployed on Stellar network
2. **SDK Integration Layer**: TypeScript SDK for contract interaction
3. **Application Layer**: Next.js frontend integration with wallet providers

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Escrow UI  │  │ Crowdfund UI │  │  Wallet UI   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────┐
│         │    SDK Integration Layer            │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │Escrow Service│  │ Pool Service │  │Wallet Service│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │         Soroban SDK (@stellar/stellar-sdk)         │    │
│  └──────┬──────────────────┬──────────────────┬───────┘    │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────┐
│                    Stellar Network                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Escrow Contract│ │Pool Contract │  │Anchor Service│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────┐
│              Wallet Providers (External)                    │
│    Lobstr  │  Freighter  │  Albedo  │  xBull               │
└─────────────────────────────────────────────────────────────┘
```

### Smart Contract Architecture

The system will deploy three primary smart contracts:

1. **Escrow Contract**: Manages time-based and milestone-based payment releases
2. **Crowdfunding Pool Contract**: Handles multi-investor funding pools
3. **P2P Transaction Contract**: Facilitates direct peer-to-peer payments with optional escrow

## Components and Interfaces

### 1. Smart Contracts (Rust/Soroban)

#### Escrow Contract

**State Structure:**
```rust
pub struct EscrowContract {
    pub contract_id: BytesN<32>,
    pub client: Address,           // Project owner
    pub provider: Address,         // Service provider
    pub total_amount: i128,
    pub released_amount: i128,
    pub release_type: ReleaseType, // TimeBased or MilestoneBased
    pub milestones: Vec<Milestone>,
    pub time_schedule: Vec<TimeRelease>,
    pub status: ContractStatus,    // Active, Completed, Disputed
    pub created_at: u64,
}

pub enum ReleaseType {
    TimeBased,
    MilestoneBased,
}

pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: i128,
    pub completed: bool,
    pub completed_at: Option<u64>,
}

pub struct TimeRelease {
    pub release_date: u64,
    pub amount: i128,
    pub released: bool,
}
```

**Key Functions:**
- `initialize(client, provider, amount, release_type, config)`: Create new escrow
- `complete_milestone(milestone_id)`: Mark milestone complete and release funds
- `release_time_based()`: Automatically release funds based on schedule
- `dispute()`: Initiate dispute resolution
- `resolve_dispute(resolution)`: Admin function to resolve disputes
- `get_status()`: Query current contract state
- `withdraw_released()`: Provider withdraws released funds

#### Crowdfunding Pool Contract

**State Structure:**
```rust
pub struct PoolContract {
    pub pool_id: BytesN<32>,
    pub project_owner: Address,
    pub funding_goal: i128,
    pub deadline: u64,
    pub total_raised: i128,
    pub contributors: Map<Address, i128>,
    pub status: PoolStatus,        // Funding, Funded, Failed
    pub escrow_contract: Option<Address>,
}
```

**Key Functions:**
- `initialize(owner, goal, deadline)`: Create funding pool
- `contribute(amount)`: Add funds to pool
- `finalize()`: Close pool and create escrow if goal met
- `refund()`: Return funds if goal not met
- `get_pool_info()`: Query pool status and stats

#### P2P Transaction Contract

**State Structure:**
```rust
pub struct P2PContract {
    pub sender: Address,
    pub receiver: Address,
    pub amount: i128,
    pub use_escrow: bool,
    pub release_condition: Option<ReleaseCondition>,
    pub status: TransactionStatus,
}
```

**Key Functions:**
- `send_direct(receiver, amount)`: Instant P2P transfer
- `send_with_escrow(receiver, amount, condition)`: Escrow-protected transfer
- `confirm_receipt()`: Receiver confirms and releases escrow
- `cancel()`: Cancel pending transaction

### 2. SDK Integration Layer (TypeScript)

#### Core SDK Module (`lib/stellar/sdk.ts`)

```typescript
export class StellarSDK {
  private server: Server;
  private network: Networks;
  private contractIds: ContractIds;
  
  constructor(config: StellarConfig) {
    this.server = new Server(config.horizonUrl);
    this.network = config.network;
    this.contractIds = config.contractIds;
  }
  
  // Contract deployment
  async deployContract(wasmHash: string, deployer: Keypair): Promise<string>;
  
  // Transaction building and submission
  async buildTransaction(operations: Operation[]): Promise<Transaction>;
  async submitTransaction(tx: Transaction, signer: Signer): Promise<TransactionResult>;
  
  // Event monitoring
  subscribeToContractEvents(contractId: string, callback: EventCallback): Subscription;
}
```

#### Escrow Service (`lib/stellar/services/escrow.ts`)

```typescript
export class EscrowService {
  constructor(private sdk: StellarSDK) {}
  
  async createEscrow(params: CreateEscrowParams): Promise<EscrowContract>;
  async completeMilestone(contractId: string, milestoneId: number): Promise<void>;
  async getEscrowStatus(contractId: string): Promise<EscrowStatus>;
  async withdrawReleased(contractId: string): Promise<void>;
  async disputeEscrow(contractId: string, reason: string): Promise<void>;
  
  // Real-time monitoring
  watchEscrow(contractId: string): Observable<EscrowEvent>;
}

export interface CreateEscrowParams {
  provider: string;
  totalAmount: string;
  releaseType: 'time-based' | 'milestone-based';
  milestones?: MilestoneConfig[];
  timeSchedule?: TimeReleaseConfig[];
}
```

#### Crowdfunding Service (`lib/stellar/services/crowdfunding.ts`)

```typescript
export class CrowdfundingService {
  constructor(private sdk: StellarSDK) {}
  
  async createPool(params: CreatePoolParams): Promise<PoolContract>;
  async contribute(poolId: string, amount: string): Promise<void>;
  async finalizePool(poolId: string): Promise<void>;
  async requestRefund(poolId: string): Promise<void>;
  async getPoolInfo(poolId: string): Promise<PoolInfo>;
  
  // Monitoring
  watchPool(poolId: string): Observable<PoolEvent>;
}
```

#### Wallet Service (`lib/stellar/services/wallet.ts`)

```typescript
export class WalletService {
  private connectedWallet: WalletProvider | null = null;
  
  async connectWallet(provider: WalletType): Promise<WalletConnection>;
  async disconnectWallet(): Promise<void>;
  async signTransaction(tx: Transaction): Promise<Transaction>;
  getPublicKey(): string | null;
  isConnected(): boolean;
  
  // Supported wallets
  getSupportedWallets(): WalletType[];
}

export type WalletType = 'lobstr' | 'freighter' | 'albedo' | 'xbull';

export interface WalletProvider {
  connect(): Promise<string>;
  disconnect(): Promise<void>;
  signTransaction(xdr: string): Promise<string>;
  getPublicKey(): string;
}
```

#### Anchor Service (`lib/stellar/services/anchor.ts`)

```typescript
export class AnchorService {
  constructor(private anchorDomain: string) {}
  
  async onRamp(params: OnRampParams): Promise<OnRampSession>;
  async offRamp(params: OffRampParams): Promise<OffRampSession>;
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate>;
  async getTransactionStatus(id: string): Promise<TransactionStatus>;
  
  // SEP-24 interactive flow
  async startInteractiveDeposit(asset: string): Promise<InteractiveSession>;
  async startInteractiveWithdraw(asset: string): Promise<InteractiveSession>;
}

export interface OnRampParams {
  amount: string;
  currency: string;
  destinationAddress: string;
  paymentMethod: PaymentMethod;
}
```

### 3. Application Layer Components

#### Wallet Connection Component (`components/stellar/wallet-connector.tsx`)

```typescript
export function WalletConnector() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  
  // Wallet connection UI with support for all wallet types
  // Display connection status and public key
  // Handle wallet switching
}
```

#### Escrow Creation Component (`components/stellar/create-escrow.tsx`)

```typescript
export function CreateEscrow() {
  const [releaseType, setReleaseType] = useState<'time' | 'milestone'>('milestone');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([]);
  
  // Form for creating escrow contracts
  // Dynamic milestone/time schedule builder
  // Amount and recipient configuration
}
```

#### Crowdfunding Component (`components/stellar/crowdfunding-pool.tsx`)

```typescript
export function CrowdfundingPool({ poolId }: { poolId: string }) {
  const poolInfo = usePoolInfo(poolId);
  const [contributionAmount, setContributionAmount] = useState('');
  
  // Display pool progress and stats
  // Contribution interface
  // Real-time updates via WebSocket/polling
}
```

#### On/Off Ramp Component (`components/stellar/fiat-gateway.tsx`)

```typescript
export function FiatGateway() {
  const [mode, setMode] = useState<'onramp' | 'offramp'>('onramp');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  
  // Fiat to crypto conversion interface
  // Display exchange rates and fees
  // Integrate with Anchor SEP-24 flow
}
```

## Data Models

### Database Schema (for off-chain data)

```typescript
// Escrow metadata (contract address stored on-chain)
interface EscrowMetadata {
  id: string;
  contractAddress: string;
  projectId: string;
  clientId: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pool metadata
interface PoolMetadata {
  id: string;
  contractAddress: string;
  projectId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction history (for UI display)
interface TransactionRecord {
  id: string;
  txHash: string;
  type: 'escrow_create' | 'milestone_complete' | 'pool_contribute' | 'onramp' | 'offramp';
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  userId: string;
  createdAt: Date;
}

// Wallet connections (session storage)
interface WalletConnection {
  publicKey: string;
  walletType: WalletType;
  connectedAt: Date;
}
```

## Error Handling

### Error Categories

1. **Network Errors**: Connection issues, timeout, RPC failures
2. **Contract Errors**: Invalid parameters, insufficient funds, unauthorized access
3. **Wallet Errors**: User rejection, wallet not installed, signing failures
4. **Anchor Errors**: KYC failures, payment processing issues

### Error Handling Strategy

```typescript
export class StellarError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: any
  ) {
    super(message);
  }
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  ANCHOR_ERROR = 'ANCHOR_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  USER_REJECTED = 'USER_REJECTED',
}

// Centralized error handler
export function handleStellarError(error: StellarError): UserFriendlyMessage {
  switch (error.code) {
    case ErrorCode.USER_REJECTED:
      return { title: 'Transaction Cancelled', message: 'You rejected the transaction' };
    case ErrorCode.INSUFFICIENT_FUNDS:
      return { title: 'Insufficient Funds', message: 'Your wallet balance is too low' };
    // ... other cases
  }
}
```

### Retry Logic

```typescript
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoff: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Testing Strategy

### Unit Tests

- **Smart Contracts**: Test each contract function in isolation using Soroban test framework
- **SDK Services**: Mock Stellar SDK and test service logic
- **Components**: Test React components with mocked wallet and SDK services

### Integration Tests

- **Contract Deployment**: Deploy contracts to testnet and verify initialization
- **End-to-End Flows**: Test complete escrow creation → milestone completion → fund release
- **Wallet Integration**: Test connection and signing with each wallet provider
- **Anchor Integration**: Test on/off-ramp flows with Anchor testnet

### Test Environment Setup

```typescript
// Test configuration
export const TEST_CONFIG = {
  network: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  contractIds: {
    escrow: 'TEST_ESCROW_CONTRACT_ID',
    pool: 'TEST_POOL_CONTRACT_ID',
    p2p: 'TEST_P2P_CONTRACT_ID',
  },
  anchorDomain: 'testanchor.stellar.org',
};

// Mock wallet for testing
export class MockWallet implements WalletProvider {
  async connect() { return 'MOCK_PUBLIC_KEY'; }
  async disconnect() {}
  async signTransaction(xdr: string) { return xdr; }
  getPublicKey() { return 'MOCK_PUBLIC_KEY'; }
}
```

### Testing Checklist

- [ ] Escrow contract deployment and initialization
- [ ] Milestone-based payment release
- [ ] Time-based payment release
- [ ] Crowdfunding pool creation and contribution
- [ ] Pool finalization when goal met
- [ ] Pool refund when goal not met
- [ ] P2P direct transfers
- [ ] P2P escrow transfers
- [ ] Wallet connection for each provider (Lobstr, Freighter, Albedo, xBull)
- [ ] Transaction signing and submission
- [ ] On-ramp flow with Anchor
- [ ] Off-ramp flow with Anchor
- [ ] Error handling for all failure scenarios
- [ ] Real-time event monitoring
- [ ] Contract state synchronization

## Security Considerations

### Smart Contract Security

1. **Access Control**: Only authorized parties can trigger fund releases
2. **Reentrancy Protection**: Prevent reentrancy attacks using checks-effects-interactions pattern
3. **Integer Overflow**: Use safe math operations
4. **Input Validation**: Validate all parameters before state changes
5. **Pausability**: Admin ability to pause contracts in emergency

### Application Security

1. **Private Key Management**: Never store private keys; always use wallet providers
2. **Transaction Verification**: Verify transaction details before signing
3. **XSS Protection**: Sanitize all user inputs
4. **HTTPS Only**: All API calls over secure connections
5. **Rate Limiting**: Prevent abuse of contract interactions

### Audit Requirements

- Smart contracts should undergo professional security audit before mainnet deployment
- Regular dependency updates for SDK and libraries
- Monitoring for suspicious transaction patterns

## Deployment Strategy

### Contract Deployment

1. **Development**: Deploy to Stellar testnet for development
2. **Staging**: Deploy to testnet with production-like configuration
3. **Production**: Deploy to Stellar mainnet after audit

### Configuration Management

```typescript
// Environment-based configuration
export const STELLAR_CONFIG = {
  development: {
    network: Networks.TESTNET,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    // ... testnet contract IDs
  },
  production: {
    network: Networks.PUBLIC,
    horizonUrl: 'https://horizon.stellar.org',
    // ... mainnet contract IDs
  },
};
```

### Monitoring and Observability

- Transaction success/failure rates
- Contract interaction latency
- Wallet connection success rates
- Anchor transaction completion times
- Error frequency by type

## Performance Considerations

### Optimization Strategies

1. **Caching**: Cache contract state locally with periodic refresh
2. **Batch Operations**: Group multiple contract calls when possible
3. **Lazy Loading**: Load contract data only when needed
4. **WebSocket Subscriptions**: Use Stellar's streaming API for real-time updates
5. **Pagination**: Paginate transaction history and pool lists

### Expected Performance Metrics

- Contract deployment: < 10 seconds
- Transaction confirmation: 5-7 seconds (Stellar network speed)
- Wallet connection: < 2 seconds
- Contract state query: < 1 second
- Event notification: < 10 seconds from on-chain event

## Dependencies

### Required Packages

```json
{
  "@stellar/stellar-sdk": "^12.0.0",
  "soroban-client": "^1.0.0",
  "@stellar/freighter-api": "^2.0.0",
  "@creit.tech/stellar-wallets-kit": "^1.0.0"
}
```

### External Services

- Stellar Horizon API (RPC endpoint)
- Stellar Soroban RPC
- Anchor service (SEP-24 compliant)
- Wallet provider APIs (Lobstr, Freighter, Albedo, xBull)

## Future Enhancements

1. **Multi-signature Escrow**: Require multiple approvals for fund release
2. **Automated Dispute Resolution**: Oracle-based dispute resolution
3. **Recurring Payments**: Subscription-style payment contracts
4. **Cross-border Payments**: Multi-currency support with automatic conversion
5. **Insurance Pools**: Optional insurance for escrow contracts
6. **Reputation System**: On-chain reputation scores for users
