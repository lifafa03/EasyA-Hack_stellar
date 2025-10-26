# 🎯 GLM 4.6 Optimal Prompts for StellarWork+ Development

This document contains production-ready prompts for GLM 4.6 to build StellarWork+ features with Stellar blockchain integration and Trustless Work escrow system.

---

## 📌 Core Principles for Effective Prompts

1. **Be Outcome-Oriented** - State what you want to achieve, not how
2. **Eliminate Ambiguity** - Provide clear requirements and constraints
3. **Use Natural Language** - Write as if talking to a collaborator
4. **Include Context** - Reference existing code patterns and dependencies
5. **Specify Technology** - Mention frameworks, versions, and examples

---

## 🚀 Prompt Template Structure

```
[GOAL]: Build/Fix/Update [feature]

[CONTEXT]:
- Project: StellarWork+ (Next.js 16, React 19, TypeScript)
- Blockchain: Stellar Testnet with Soroban smart contracts
- Integration: Trustless Work API for escrow management
- Wallet: Freighter/Albedo via @stellar/freighter-api
- Theme: Green accent (#4ade80), dark mode support

[REQUIREMENTS]:
1. [Specific requirement 1]
2. [Specific requirement 2]
...

[CONSTRAINTS]:
- Use existing patterns from [file references]
- Include checkpoint validation from lib/stellar/validation.ts
- Handle errors with auto-retry (max 3 attempts)
- Show toast notifications for all user actions
- Support wallet disconnection gracefully

[REFERENCES]:
- Code: [relevant files]
- Docs: https://developers.stellar.org, https://github.com/Trustless-Work
- Contracts: https://github.com/soroswap, https://github.com/script3

[OUTPUT]:
- Fully working TypeScript/React component
- Include all imports and type definitions
- Add inline comments for complex logic
- No placeholder functions or mock data
```

---

## 📦 Example Prompts by Feature

### 1. Create Project with Escrow Deployment

```
Build a Stellar-integrated project creation flow that converts the existing post-project form into a real escrow deployment system.

GOAL: When a user submits the "Post Project" form, create a Trustless Work escrow contract on Stellar blockchain with milestones.

CONTEXT:
- Current file: app/post-project/page.tsx (has mock UI)
- Wallet state: Available via useWallet() hook
- Escrow API: lib/stellar/trustless-work.ts createEscrow()
- Validation: lib/stellar/validation.ts validateEscrowCreation()

REQUIREMENTS:
1. Before form submission, check wallet connection (redirect to connect if not)
2. Validate escrow parameters using validateEscrowCreation checkpoint
3. Extract form data: title, category, description, budget, milestones, skills
4. Call createEscrow() with client address, total budget, and milestone array
5. Show loading state during transaction signing and submission
6. On success: redirect to project detail page with escrow ID
7. On error: show error toast, allow retry, log details to console
8. Store project metadata (title, description, skills) in localStorage temporarily

CONSTRAINTS:
- Milestones must sum to total budget (validate before submission)
- Minimum 1 milestone required, maximum 10 milestones
- Each milestone needs: title, budget, description
- Use USDC as default currency (from .env.local)
- Transaction fee info displayed before signing
- Support auto-retry on network errors (3 attempts, 2s delay)

IMPLEMENTATION:
- Add wallet connection check in handleSubmit
- Wrap createEscrow call in executeWithRetry for auto-correction
- Show transaction progress: "Preparing..." → "Sign in wallet..." → "Submitting..." → "Success!"
- Display transaction hash as clickable link to Stellar Expert
- Include "View on Blockchain" button after success

REFERENCES:
- Existing form: app/post-project/page.tsx (lines 50-300)
- Wallet hook: hooks/use-wallet.ts
- Escrow API: lib/stellar/trustless-work.ts (createEscrow function)
- Validation: lib/stellar/validation.ts (validateEscrowCreation checkpoint)
- Trustless Work examples: https://github.com/Trustless-Work/demo-Trustless-Work

OUTPUT:
Updated app/post-project/page.tsx with:
1. Wallet connection requirement check
2. Escrow parameter validation before submission  
3. Real blockchain transaction via createEscrow()
4. Loading states and progress indicators
5. Success redirect with escrow ID
6. Error handling with auto-retry
7. Transaction hash display and blockchain link
```

---

### 2. Implement Bidding with Smart Contracts

```
Transform the mock bidding system into on-chain bid proposals with escrow agreements.

GOAL: When a freelancer submits a bid, create a signed proposal on Stellar that the client can accept to initiate the escrow.

CONTEXT:
- Current bid form: app/project/[id]/page.tsx (Dialog with mock submission)
- Project data includes: escrowId, budget, milestones
- Need to create bid proposal that client can approve on-chain

REQUIREMENTS:
1. Freelancer must be wallet-connected to submit bid
2. Bid includes: amount, delivery time, proposal text, portfolio links
3. Create signed message with bid details using wallet
4. Store bid proposal hash on-chain (via Trustless Work or custom contract)
5. Client can view all bids with their on-chain signatures
6. When client accepts bid, freelancer is added to escrow contract
7. Show verification badge for on-chain bids vs off-chain

CONSTRAINTS:
- Bid amount cannot exceed project budget
- Delivery time must be positive integer (days)
- Proposal text required (min 50 characters)
- Only wallet-connected freelancers can bid
- Signature verification before displaying bid to client
- Support bid updates (create new signed version)

IMPLEMENTATION:
- Add signBidProposal() function to lib/stellar/contracts.ts
- Use wallet.signMessage() to sign bid data
- Call Trustless Work API to register bid on escrow
- Fetch and verify all bid signatures when displaying
- Add "Verified On-Chain" badge for valid signatures
- Implement acceptBid() to update escrow contract

VALIDATION CHECKPOINTS:
1. Validate wallet connection before bid submission
2. Validate bid parameters (amount, timeline, content)
3. Verify signature after signing
4. Confirm transaction on blockchain
5. Auto-retry on network failures

REFERENCES:
- Bid form UI: app/project/[id]/page.tsx
- Wallet signing: hooks/use-wallet.ts
- Contract utils: lib/stellar/contracts.ts
- Message signing: @stellar/stellar-sdk (signMessage)
- Trustless Work: https://github.com/Trustless-Work/dApp-Trustless-Work

OUTPUT:
1. Updated app/project/[id]/page.tsx with on-chain bidding
2. New signBidProposal() in lib/stellar/contracts.ts
3. Bid verification UI with "Verified" badges
4. Accept bid flow that updates escrow contract
5. Error handling for signature failures
```

---

### 3. Add Investor Pooling with Yield-Bearing Escrows

```
Implement investor funding with yield generation using Trustless Work's TrustYield integration.

GOAL: Allow investors to fund projects by contributing to escrows and earn yield while funds are locked.

CONTEXT:
- Investor funding button exists in app/project/[id]/page.tsx
- Need to integrate TrustYield from Trustless Work
- Display APY and projected earnings
- Track investor contributions and yield earned

REQUIREMENTS:
1. Investor connects wallet before funding
2. Choose funding amount (partial funding allowed)
3. Enable yield-bearing option (checkbox)
4. Display projected APY and earnings estimate
5. Call fundEscrow() with enableYield parameter
6. Track investor's contribution in contract
7. Show real-time yield accumulation
8. Release principal + yield when project completes

CONSTRAINTS:
- Minimum investment: 10 USDC
- Maximum per investor: 50% of remaining budget
- Yield rate sourced from Trustless Work API
- Funds locked until project completion or milestone
- Support multiple investors per project
- Display investor count and total funded

IMPLEMENTATION:
- Add yield toggle to funding dialog
- Fetch current APY from getEscrowYield()
- Calculate and display earnings projection
- Call fundEscrow() with enableYield: true
- Add investor tracker component showing all funders
- Real-time yield update every 30 seconds
- "Claim Yield" button for completed milestones

VALIDATION:
1. Check wallet connection and USDC balance
2. Validate funding amount (min/max constraints)
3. Verify escrow accepts additional funding
4. Confirm transaction with yield enabled
5. Monitor yield accumulation via contract events

REFERENCES:
- Funding dialog: app/project/[id]/page.tsx
- Yield API: lib/stellar/trustless-work.ts (getEscrowYield, fundEscrow)
- TrustYield dApp: https://github.com/Trustless-Work/dapp-trustyield
- Yield contracts: Trustless Work documentation

OUTPUT:
1. Enhanced funding dialog with yield option
2. APY display and earnings calculator
3. Investor dashboard showing contributions + yield
4. Real-time yield tracking component
5. Claim yield functionality
```

---

### 4. Real-Time Blockchain Data Sync

```
Build a real-time synchronization system that fetches and displays live escrow status from Stellar blockchain.

GOAL: Show real-time updates for project funding progress, milestone status, and transaction history without page refresh.

CONTEXT:
- Projects display mock data currently
- Need to fetch real escrow state from blockchain
- Use Stellar Horizon streaming for live updates
- Cache data to minimize API calls

REQUIREMENTS:
1. Fetch escrow status on component mount
2. Subscribe to escrow contract events
3. Update UI when funding changes
4. Show live milestone approvals
5. Display transaction history with timestamps
6. Auto-refresh every 30 seconds as fallback
7. Cache responses for 10 seconds

CONSTRAINTS:
- Use Horizon event streaming (Server-Sent Events)
- Debounce rapid updates (max 1 per second)
- Show loading skeleton during initial fetch
- Handle network disconnections gracefully
- Display "Last updated: X seconds ago"
- Support manual refresh button

IMPLEMENTATION:
- Create useEscrowStatus() hook with SSE subscription
- Use getEscrowStatus() for initial data
- Monitor contract events via monitorContractEvents()
- Implement optimistic UI updates
- Cache with React Query or SWR
- Add refresh indicator animation

VALIDATION:
1. Verify escrow ID exists on network
2. Parse event data correctly
3. Handle malformed responses
4. Retry failed subscriptions
5. Validate state transitions (pending → approved)

REFERENCES:
- Escrow API: lib/stellar/trustless-work.ts
- Contract events: lib/stellar/contracts.ts (monitorContractEvents)
- Horizon streaming: https://developers.stellar.org/api/horizon/streaming
- React hooks patterns: hooks/use-wallet.ts

OUTPUT:
1. useEscrowStatus() hook with real-time updates
2. EscrowStatusCard component with live data
3. Transaction history component
4. Loading and error states
5. Manual refresh functionality
```

---

### 5. USDC Payment System with Trustlines

```
Implement complete USDC payment infrastructure including trustline creation, transfers, and balance checks.

GOAL: Enable seamless USDC payments for project funding and milestone releases with automatic trustline management.

CONTEXT:
- USDC is configured in .env.local with issuer address
- Need trustline establishment before receiving USDC
- Current system assumes USDC availability
- Must handle users without USDC trustline

REQUIREMENTS:
1. Check if user has USDC trustline on wallet connect
2. Prompt to create trustline if missing
3. Guide through trustline creation with 1-click
4. Display USDC balance in wallet component
5. Validate sufficient USDC before transactions
6. Show estimated fees in USDC and XLM
7. Handle trustline limits and balance constraints

CONSTRAINTS:
- Trustline creation requires ~0.5 XLM reserve
- Check minimum XLM balance before trustline creation
- USDC issuer from environment variable
- Validate issuer is correct network (testnet/mainnet)
- Show warning if USDC balance too low for transaction
- Support multiple stablecoins (USDC, EURC) in future

IMPLEMENTATION:
- Add checkUSDCTrustline() to lib/stellar/wallet.ts
- Create createTrustline() function with validation
- Update useWallet hook to check trustline on connect
- Add "Setup USDC" prompt in wallet dialog if missing
- Display USDC balance prominently in UI
- validateUSDCPayment() checkpoint before transfers

VALIDATION CHECKPOINTS:
1. Validate wallet has sufficient XLM for trustline reserve
2. Check USDC issuer matches environment configuration
3. Verify trustline creation transaction success
4. Validate USDC balance before payment
5. Confirm payment transaction completes

REFERENCES:
- Trustlines guide: https://developers.stellar.org/docs/issuing-assets/anatomy-of-an-asset
- Wallet utils: lib/stellar/wallet.ts
- Asset configuration: lib/stellar/config.ts (USDC_ASSET)
- Payment operations: @stellar/stellar-sdk Operation.payment()

OUTPUT:
1. Trustline management functions in lib/stellar/wallet.ts
2. Updated useWallet hook with USDC checks
3. Trustline creation UI component
4. USDC balance display
5. Payment validation with clear error messages
```

---

## 🎨 UI/UX Enhancement Prompts

### Create Loading Skeletons

```
Design and implement loading skeleton components for blockchain data fetching states.

GOAL: Show polished loading states while fetching escrow data, transaction history, and bids from Stellar blockchain.

REQUIREMENTS:
1. Match existing card layouts exactly
2. Animate with pulse or shimmer effect
3. Show realistic content placeholders
4. Display for minimum 300ms to avoid flashing
5. Smooth transition to real content

CONSTRAINTS:
- Use existing theme colors and spacing
- Support dark/light mode
- Accessible (proper ARIA labels)
- Reusable across different card types

REFERENCES:
- Existing cards: app/project/[id]/page.tsx
- Skeleton patterns: components/ui/skeleton.tsx
- Loading examples: app/browse/loading.tsx

OUTPUT:
- ProjectCardSkeleton component
- EscrowStatusSkeleton component  
- BidListSkeleton component
```

---

### Error Boundary for Blockchain Operations

```
Create comprehensive error boundary for graceful blockchain error handling.

GOAL: Catch and display user-friendly errors for all Stellar/Trustless Work operations with retry options.

REQUIREMENTS:
1. Catch wallet connection errors
2. Handle transaction failures
3. Show specific error messages (not generic "error occurred")
4. Provide actionable retry buttons
5. Log detailed errors to console for debugging
6. Support error reporting to external service

CONSTRAINTS:
- Don't expose private keys or sensitive data in errors
- Distinguish network errors from user errors
- Show helpful suggestions (e.g., "Add more XLM for fees")
- Maintain user's form data after error
- Support error boundary reset

OUTPUT:
- StellarErrorBoundary component
- Error classification utility
- User-friendly error message mapping
- Retry mechanism with exponential backoff
```

---

## 🧪 Testing Prompts

### Create E2E Test for Escrow Creation

```
Write Playwright end-to-end test for complete project creation flow with escrow deployment.

GOAL: Automate testing of wallet connection → project form → escrow creation → verification on blockchain.

REQUIREMENTS:
1. Mock Freighter wallet interaction
2. Fill project creation form programmatically
3. Simulate transaction signing
4. Verify escrow contract deployed
5. Check project appears in browse page
6. Validate all checkpoints pass

CONSTRAINTS:
- Use Stellar testnet
- Mock wallet to avoid real signatures
- Clean up test data after run
- Run in CI/CD pipeline
- Generate test report

REFERENCES:
- Testing setup: https://playwright.dev/docs/writing-tests
- Stellar mocking patterns
- Existing form: app/post-project/page.tsx

OUTPUT:
- e2e/project-creation.spec.ts test file
- Wallet mock utilities
- Test data generators
- CI/CD integration instructions
```

---

## 🐛 Debugging Prompts

### Debug Transaction Failure

```
Debug this Stellar transaction error and provide auto-correction:

ERROR: "Transaction failed: tx_bad_seq"

CONTEXT:
- User: [wallet address]
- Operation: Creating escrow contract
- Network: Testnet
- Transaction XDR: [paste XDR]

INVESTIGATION STEPS:
1. Check current account sequence number via Horizon API
2. Compare with transaction sequence
3. Verify no pending transactions
4. Check if sequence was already used

AUTO-CORRECTION STRATEGY:
- Fetch latest sequence from blockchain
- Rebuild transaction with correct sequence
- Retry submission with new sequence
- Add sequence validation to checkpoint

REFERENCES:
- Sequence errors: https://developers.stellar.org/docs/encyclopedia/errors
- Validation: lib/stellar/validation.ts (validateTransaction)

OUTPUT:
- Root cause explanation
- Fixed transaction code
- Updated validation checkpoint
- Prevention strategy for future
```

---

## 📊 Performance Optimization Prompts

### Optimize Blockchain Data Fetching

```
Optimize escrow data fetching to minimize Horizon API calls and improve load times.

GOAL: Reduce page load time by 50% through caching, batching, and efficient querying.

CURRENT ISSUES:
- Multiple sequential API calls on page load
- No caching of escrow data
- Fetching full transaction history unnecessarily
- Real-time updates too frequent

OPTIMIZATION STRATEGIES:
1. Implement request batching (combine multiple queries)
2. Add React Query with 30-second cache
3. Lazy load transaction history (pagination)
4. Debounce real-time event subscriptions
5. Use IndexedDB for offline caching
6. Prefetch related escrow data

CONSTRAINTS:
- Data must be fresh (max 30 seconds stale)
- Support offline viewing of cached data
- Show cache timestamp to user
- Don't sacrifice accuracy for speed
- Maintain real-time updates for critical changes

IMPLEMENTATION:
- Add React Query setup
- Create escrow data fetching service
- Implement batch query utility
- Add cache invalidation on user actions
- Lazy load components with Suspense

OUTPUT:
- Optimized data fetching layer
- React Query configuration
- Performance benchmarks
- Caching strategy documentation
```

---

## 🔒 Security Prompts

### Implement Transaction Security Checks

```
Add comprehensive security validation for all Stellar transactions before user signs.

GOAL: Protect users from malicious transactions, incorrect amounts, and scam contracts.

SECURITY CHECKS:
1. Verify destination addresses (whitelist known contracts)
2. Validate transaction amounts (max limits per user setting)
3. Check contract IDs against known good contracts
4. Warn on suspicious operations (unusual fees, operations)
5. Display human-readable transaction summary
6. Require explicit confirmation for high-value transactions

CONSTRAINTS:
- Never auto-sign transactions
- Show full transaction details before signing
- Highlight risky operations in red
- Allow user to cancel anytime
- Log all security warnings
- Support user-configurable risk thresholds

IMPLEMENTATION:
- Create security validation layer
- Build transaction analyzer
- Design confirmation dialog with details
- Add risk scoring system
- Implement user preferences for limits

OUTPUT:
- Transaction security validator
- Enhanced confirmation dialog
- Risk scoring algorithm
- User security settings page
```

---

## 📖 Documentation Prompts

### Generate API Documentation

```
Create comprehensive API documentation for all Stellar integration functions.

GOAL: Document every function in lib/stellar/ with usage examples, parameters, returns, and error cases.

FORMAT:
- JSDoc comments for all functions
- Example code snippets
- Error handling examples
- Integration guide for new developers

SECTIONS:
1. Wallet functions (connect, disconnect, balance)
2. Escrow operations (create, fund, release)
3. Contract interactions (invoke, read, deploy)
4. Validation checkpoints
5. Common error scenarios

OUTPUT:
- Updated source files with JSDoc
- README.md with quick start guide
- API reference in Markdown
- Interactive examples
```

---

## 🎯 Production Deployment Prompts

### Configure Mainnet Deployment

```
Prepare StellarWork+ for mainnet deployment with proper configuration and safety checks.

GOAL: Deploy to Stellar mainnet with production-ready configuration, monitoring, and rollback plan.

PRE-DEPLOYMENT CHECKLIST:
1. Update .env for mainnet (Horizon, RPC URLs)
2. Configure production USDC issuer
3. Deploy/verify Trustless Work contracts on mainnet
4. Test all flows on mainnet with small amounts
5. Setup error monitoring (Sentry)
6. Configure rate limiting
7. Enable transaction logging
8. Create rollback procedure

MAINNET CONFIGURATION:
- NEXT_PUBLIC_STELLAR_NETWORK=mainnet
- NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org
- Production USDC issuer (official Circle issuer)
- Real Trustless Work contract IDs
- Enhanced error logging
- Transaction amount limits

SAFETY MEASURES:
- Testnet mode toggle in UI
- Transaction amount warnings (>$1000)
- Multi-step confirmations for large transactions
- Automatic circuit breaker on errors
- Admin dashboard for monitoring

OUTPUT:
- Mainnet configuration guide
- Deployment checklist
- Monitoring setup
- Rollback procedures
- Security audit recommendations
```

---

## 💬 Example Conversation Flow with GLM 4.6

```
YOU: Use the "Create Project with Escrow Deployment" prompt above to update app/post-project/page.tsx

GLM 4.6: [Provides updated code with full Stellar integration]

YOU: The code looks good, but add a preview step before submitting the transaction where users can review all details and estimated fees.

GLM 4.6: [Adds preview modal with transaction summary]

YOU: Perfect! Now add checkpoint validation that runs when the preview is shown, and auto-corrects any issues before the user sees it.

GLM 4.6: [Integrates validateEscrowCreation with auto-correction]

YOU: Excellent! One more thing - if validation fails, show specific error messages with suggestions on how to fix (e.g., "Add 50 more USDC to meet minimum budget").

GLM 4.6: [Adds detailed error messages with actionable fixes]

YOU: Great! Now let's test it. What test cases should I run?

GLM 4.6: [Provides test scenarios and expected outcomes]
```

---

## ✅ Prompt Checklist

Before sending a prompt to GLM 4.6, verify:

- [ ] Clear goal stated
- [ ] Context provided (existing code, dependencies)
- [ ] Specific requirements listed
- [ ] Constraints defined
- [ ] References included (docs, examples)
- [ ] Expected output described
- [ ] Technology stack mentioned
- [ ] Error handling requirements
- [ ] Validation checkpoints specified
- [ ] UI/UX considerations included

---

## 🚀 Quick Reference Commands

### Get Implementation for Feature X:
```
Build [feature] for StellarWork+ using:
- Stellar SDK for blockchain
- Trustless Work for escrows
- Existing patterns from [file]
- Checkpoint validation from lib/stellar/validation.ts

Include: error handling, loading states, toast notifications, wallet checks
```

### Debug Issue Y:
```
Debug this error in StellarWork+:
[error message]

Context: [operation, user state, code location]
Expected: [what should happen]
Actual: [what's happening]

Investigate: [specific areas to check]
Auto-correct: [how to fix automatically]
```

### Optimize Component Z:
```
Optimize [component] performance:
Current: [metrics]
Goal: [target metrics]

Strategies: caching, lazy loading, memoization, code splitting
Maintain: functionality, UX, accessibility
Measure: before/after benchmarks
```

---

**These prompts will help you build StellarWork+ efficiently with GLM 4.6! Start with the escrow deployment prompt and progress through the features systematically.** 🎯
