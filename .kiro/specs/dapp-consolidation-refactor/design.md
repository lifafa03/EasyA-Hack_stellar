# Design Document

## Overview

This design consolidates the Stellar marketplace dApp into a streamlined application focused on three core flows: browsing projects, funding projects with USDC, and cashing out earnings. The architecture leverages Trustless Work's USDC escrow contracts for secure milestone-based payments while simplifying the UI to reduce cognitive load and improve user experience.

### Key Design Principles

1. **USDC-First**: All monetary values displayed and transacted in USDC
2. **Consolidation**: Reduce page count by merging related functionality
3. **Progressive Disclosure**: Show advanced features only when needed
4. **Clear CTAs**: Every page has obvious next actions
5. **Trustless Work Integration**: Leverage existing escrow infrastructure

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
├─────────────────────────────────────────────────────────┤
│  Browse Page  │  Project Detail  │  Profile  │ Dashboard│
├─────────────────────────────────────────────────────────┤
│                   Service Layer                          │
├──────────────┬──────────────┬──────────────┬───────────┤
│ Trustless    │   Wallet     │   Anchor     │  Storage  │
│ Work Service │   Service    │   Service    │  Service  │
├──────────────┴──────────────┴──────────────┴───────────┤
│                  Stellar SDK Layer                       │
├─────────────────────────────────────────────────────────┤
│              Stellar Network (Testnet/Mainnet)          │
└─────────────────────────────────────────────────────────┘
```

### Page Architecture

**Before (Current):**
- Home → Browse → Project Detail → Post Project → Dashboard → Profile

**After (Consolidated):**
- Home → Browse → Project Detail
- Profile (includes: deposits, withdrawals, history, settings)
- Dashboard (simplified: active bids & investments only)

### Data Flow

```
User Action → UI Component → Service Layer → Stellar Network
                ↓                    ↓              ↓
            State Update ← Response ← Transaction Result
```

## Components and Interfaces

### 1. Browse Page Component

**Purpose**: Project discovery and filtering

**Key Features**:
- Grid layout of project cards
- Category and search filters
- USDC budget and funding progress display
- Direct navigation to project details

**State Management**:
```typescript
interface BrowseState {
  projects: Project[];
  selectedCategory: string;
  searchQuery: string;
  loading: boolean;
}
```

**API Integration**:
- Fetch projects from backend/blockchain
- Real-time funding updates via WebSocket or polling

### 2. Project Detail Page Component

**Purpose**: Comprehensive project view with funding and bidding

**Tabs Structure**:
1. **Overview**: Description, skills, client info
2. **Milestones**: Milestone breakdown with completion status
3. **Escrow**: Contract details, funding progress, withdrawal options
4. **Bids**: All submitted bids with verification status

**Key Interactions**:
- Fund Project: Opens modal with USDC amount input
- Place Bid: Opens modal with bid form and wallet signature
- Complete Milestone: Button for clients to release funds
- Withdraw Funds: Button for freelancers to claim released payments

**State Management**:
```typescript
interface ProjectDetailState {
  project: Project;
  escrowStatus: EscrowStatus;
  bids: SignedBid[];
  userRole: 'client' | 'freelancer' | 'investor' | 'visitor';
  activeTab: 'overview' | 'milestones' | 'escrow' | 'bids';
}
```

### 3. Profile Page Component (Consolidated)

**Purpose**: Unified wallet and account management

**Tab Structure**:
1. **Profile**: User info, stats, portfolio
2. **Deposit**: Fiat-to-USDC on-ramp flow
3. **Withdraw**: USDC-to-fiat off-ramp flow
4. **History**: Transaction log with filters
5. **Settings**: Anchor preferences, notifications

**Key Features**:
- Prominent USDC balance display
- Anchor selector with comparison
- Transaction history with status tracking
- Profile editing capabilities

**State Management**:
```typescript
interface ProfileState {
  user: UserProfile;
  usdcBalance: string;
  xlmBalance: string;
  selectedAnchor: AnchorProvider | null;
  transactions: FiatTransaction[];
  activeTab: 'profile' | 'deposit' | 'withdraw' | 'history' | 'settings';
}
```

### 4. Dashboard Page Component (Simplified)

**Purpose**: Quick overview of user's active engagements

**Sections**:
1. **Stats Cards**: Active bids, total earned, investments, total invested
2. **My Bids Tab**: Active bids with escrow and milestone details
3. **My Investments Tab**: Active investments with funding progress

**Removed Features** (moved to Profile):
- Deposit/withdrawal flows
- Detailed transaction history
- Profile editing

**State Management**:
```typescript
interface DashboardState {
  bids: BidWithEscrow[];
  investments: InvestmentWithProgress[];
  stats: {
    activeBids: number;
    totalEarned: string;
    activeInvestments: number;
    totalInvested: string;
  };
}
```

## Data Models

### Core Models

```typescript
// Project with Trustless Work integration
interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string; // USDC amount
  funded: string; // USDC amount
  status: 'open' | 'in-progress' | 'completed';
  
  // Escrow details
  escrowId: string;
  escrowContractAddress: string;
  escrowStatus: 'active' | 'completed' | 'disputed';
  
  // Milestones
  milestones: Milestone[];
  
  // Client info
  clientAddress: string;
  clientName: string;
  
  // Metadata
  createdAt: number;
  deadline: number;
  skills: string[];
}

// Milestone with payment tracking
interface Milestone {
  id: number;
  title: string;
  description: string;
  budget: string; // USDC amount
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  completedAt?: number;
  deliverables?: string[];
}

// Escrow status from Trustless Work
interface EscrowStatus {
  escrowId: string;
  contractAddress: string;
  status: 'active' | 'completed' | 'disputed' | 'cancelled';
  totalAmount: string; // USDC
  releasedAmount: string; // USDC
  availableToWithdraw: string; // USDC
  yieldGenerated?: string; // USDC if yield-bearing
  clientAddress: string;
  freelancerAddress?: string;
  milestones: MilestoneStatus[];
}

// Signed bid proposal
interface SignedBid {
  escrowId: string;
  freelancerAddress: string;
  bidAmount: string; // USDC
  deliveryDays: number;
  proposal: string;
  portfolioLink?: string;
  milestonesApproach?: string;
  timestamp: number;
  signature: string;
  hash: string;
  verified: boolean;
}

// User profile
interface UserProfile {
  address: string;
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  skills: string[];
  rating: number;
  totalReviews: number;
  stats: {
    projectsCompleted: number;
    totalEarned: string; // USDC
    successRate: number;
  };
}

// Fiat transaction
interface FiatTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  amount: string; // USDC
  fiatAmount?: string;
  fiatCurrency?: string;
  anchorName: string;
  timestamp: number;
  transactionHash?: string;
}
```

## Service Layer Design

### 1. Trustless Work Service

**Purpose**: Interface with Trustless Work API for escrow operations

**Key Methods**:
```typescript
class TrustlessWorkService {
  // Create new escrow with milestones
  async createEscrow(params: EscrowParams): Promise<EscrowCreationResult>
  
  // Fund existing escrow
  async fundEscrow(escrowId: string, amount: string): Promise<TransactionResult>
  
  // Release milestone payment
  async releaseMilestone(escrowId: string, milestoneId: number): Promise<TransactionResult>
  
  // Withdraw released funds
  async withdrawFunds(escrowId: string): Promise<TransactionResult>
  
  // Get escrow status
  async getEscrowStatus(escrowId: string): Promise<EscrowStatus>
  
  // Submit bid proposal
  async submitBid(signedBid: SignedBid): Promise<BidSubmissionResult>
  
  // Fetch all bids for escrow
  async fetchBids(escrowId: string): Promise<SignedBid[]>
  
  // Accept bid and assign freelancer
  async acceptBid(escrowId: string, bidHash: string): Promise<TransactionResult>
}
```

### 2. Wallet Service (Enhanced)

**Purpose**: Manage wallet connections and USDC operations

**Key Methods**:
```typescript
class WalletService {
  // Connect wallet
  async connect(walletType: WalletType): Promise<WalletConnection>
  
  // Get USDC balance (primary)
  async getUSDCBalance(address: string): Promise<string>
  
  // Get XLM balance (secondary)
  async getXLMBalance(address: string): Promise<string>
  
  // Sign message for bid verification
  async signMessage(message: string): Promise<string>
  
  // Send USDC payment
  async sendUSDC(to: string, amount: string): Promise<TransactionResult>
  
  // Establish USDC trustline if needed
  async establishUSDCTrustline(): Promise<TransactionResult>
}
```

### 3. Anchor Service

**Purpose**: Manage fiat on/off-ramp operations

**Key Methods**:
```typescript
class AnchorService {
  // Get available anchors
  getAvailableAnchors(): AnchorProvider[]
  
  // Set preferred anchor
  setPreferredAnchor(anchorId: string, userAddress: string): void
  
  // Get preferred anchor
  getPreferredAnchor(userAddress: string): AnchorProvider | null
  
  // Initiate deposit (on-ramp)
  async initiateDeposit(anchor: AnchorProvider, amount: string): Promise<DepositFlow>
  
  // Initiate withdrawal (off-ramp)
  async initiateWithdrawal(anchor: AnchorProvider, amount: string): Promise<WithdrawalFlow>
  
  // Get exchange rate
  async getExchangeRate(anchor: AnchorProvider, fiatCurrency: string): Promise<ExchangeRate>
}
```

## Error Handling

### Error Categories

1. **Wallet Errors**
   - Not connected
   - Insufficient balance
   - Transaction rejected
   - Network timeout

2. **Escrow Errors**
   - Contract not found
   - Unauthorized action
   - Invalid milestone state
   - Insufficient escrow balance

3. **Anchor Errors**
   - KYC required
   - Deposit limits exceeded
   - Unsupported currency
   - Service unavailable

### Error Handling Strategy

```typescript
interface ErrorHandler {
  // Display user-friendly error
  displayError(error: Error, context: string): void
  
  // Provide recovery actions
  suggestRecovery(errorCode: ErrorCode): RecoveryAction[]
  
  // Log for debugging
  logError(error: Error, metadata: any): void
  
  // Retry with exponential backoff
  retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number): Promise<T>
}
```

**User-Facing Error Messages**:
- "Please connect your wallet to continue"
- "Insufficient USDC balance. Deposit funds via Profile → Deposit"
- "Transaction failed. Please try again or contact support"
- "This milestone cannot be completed yet. Check the project status"

## Testing Strategy

### Unit Tests

**Components**:
- Browse page filtering and search logic
- Project detail tab switching and state management
- Profile page form validation
- Dashboard data aggregation

**Services**:
- Trustless Work API integration
- Wallet connection and signing
- Anchor flow initialization
- Error handling and recovery

### Integration Tests

**User Flows**:
1. Browse → View Project → Fund Project
2. Browse → View Project → Place Bid → Sign with Wallet
3. Profile → Deposit → Complete On-Ramp Flow
4. Dashboard → View Bid → Complete Milestone → Withdraw
5. Profile → Withdraw → Complete Off-Ramp Flow

**Escrow Operations**:
- Create escrow with milestones
- Fund escrow from multiple investors
- Release milestone payments
- Withdraw released funds
- Handle dispute scenarios

### E2E Tests

**Critical Paths**:
1. New user onboarding: Connect wallet → Deposit USDC → Fund project
2. Freelancer workflow: Browse → Bid → Win bid → Complete work → Withdraw
3. Client workflow: Post project → Review bids → Accept bid → Approve milestones
4. Investor workflow: Browse → Fund project → Track progress → Receive returns

**Test Environment**:
- Stellar Testnet
- Mock Trustless Work API
- Test anchors with fake KYC

## UI/UX Improvements

### Visual Hierarchy

**Primary Actions** (Green buttons):
- Fund Project
- Place Bid
- Deposit USDC
- Withdraw USDC

**Secondary Actions** (Outline buttons):
- View Details
- Change Anchor
- Edit Profile

**Tertiary Actions** (Ghost buttons):
- Filter
- Search
- Sort

### USDC Prominence

**Display Format**:
- Large: `$5,000 USDC` (project budgets, balances)
- Medium: `$1,234.56 USDC` (transaction amounts)
- Small: `$0.50 USDC` (fees, small amounts)

**XLM Display** (secondary):
- Only show when relevant (gas fees, XLM-specific operations)
- Format: `10.5 XLM` in muted color

### Loading States

**Skeleton Screens**:
- Project cards while loading browse page
- Project details while fetching escrow status
- Transaction history while loading records

**Progress Indicators**:
- Transaction submission: "Signing transaction..."
- Escrow creation: "Creating escrow contract..."
- Milestone release: "Releasing funds..."

### Empty States

**No Projects**: "No projects match your filters. Try adjusting your search."
**No Bids**: "You haven't placed any bids yet. Browse projects to get started."
**No Transactions**: "No transaction history yet. Deposit funds to begin."

## Security Considerations

### Wallet Security

1. **Never store private keys**: All signing happens in user's wallet
2. **Verify signatures**: Always validate bid signatures before accepting
3. **Display transaction details**: Show full transaction info before signing
4. **Timeout sessions**: Require re-authentication for sensitive operations

### Escrow Security

1. **Use Trustless Work contracts**: Leverage audited smart contracts
2. **Validate milestone completion**: Require client approval before release
3. **Dispute resolution**: Provide clear dispute initiation process
4. **Immutable records**: All escrow operations recorded on-chain

### Data Privacy

1. **Minimal PII collection**: Only collect necessary user information
2. **Encrypted storage**: Encrypt sensitive data at rest
3. **Secure transmission**: Use HTTPS for all API calls
4. **User consent**: Clear consent for data usage and anchor KYC

## Performance Optimization

### Caching Strategy

**Client-Side Cache**:
- Project list: 5 minutes
- Escrow status: 30 seconds
- User balance: 10 seconds
- Transaction history: 1 minute

**Invalidation Triggers**:
- User action (fund, bid, withdraw)
- WebSocket update
- Manual refresh

### Lazy Loading

**Components**:
- Project images: Load on scroll
- Transaction history: Paginated (20 per page)
- Bid list: Load on tab activation

**Code Splitting**:
- Route-based splitting (Browse, Project, Profile, Dashboard)
- Anchor selector: Load on demand
- Chart libraries: Load only when needed

### API Optimization

**Batch Requests**:
- Fetch multiple escrow statuses in single call
- Aggregate user stats server-side
- Combine balance queries

**WebSocket Updates**:
- Real-time escrow status changes
- Live funding progress
- Milestone completion notifications

## Migration Plan

### Phase 1: Backend Integration
1. Integrate Trustless Work API
2. Update escrow service to use USDC
3. Implement bid signing and verification
4. Test escrow operations on testnet

### Phase 2: UI Consolidation
1. Refactor Profile page to include deposit/withdraw
2. Simplify Dashboard to remove redundant features
3. Update all monetary displays to show USDC
4. Add USDC balance checks before transactions

### Phase 3: Testing & Refinement
1. Conduct integration testing
2. Perform user acceptance testing
3. Fix bugs and edge cases
4. Optimize performance

### Phase 4: Deployment
1. Deploy to testnet for beta testing
2. Gather user feedback
3. Make final adjustments
4. Deploy to mainnet

## Open Questions

1. **Trustless Work API Access**: Do we have API keys and documentation?
2. **USDC Issuer**: Which USDC asset should we use (Circle, other)?
3. **Anchor Selection**: Should we pre-select a default anchor or always prompt?
4. **Yield-Bearing Escrows**: Should we enable this feature for all projects?
5. **Dispute Resolution**: How should we handle escrow disputes in the UI?
