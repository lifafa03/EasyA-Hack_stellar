# Requirements Document

## Introduction

This specification defines the consolidation and refactoring of the Stellar marketplace dApp to streamline core user flows: browsing projects, funding projects with USDC, and cashing out earnings. The system will integrate Trustless Work's USDC escrow functionality while simplifying the UI to focus on essential features.

## Glossary

- **Stellar Network**: A blockchain platform for fast, low-cost financial transactions
- **USDC**: USD Coin, a stablecoin pegged 1:1 to the US Dollar
- **Trustless Work**: A third-party escrow service providing USDC-based smart contracts on Stellar
- **Escrow Contract**: A smart contract that holds funds until predefined conditions are met
- **Milestone**: A project phase that triggers payment release upon completion
- **Anchor**: A trusted entity that facilitates fiat-to-crypto conversions on Stellar
- **Wallet**: A Stellar wallet application (Freighter, Albedo, etc.) for managing crypto assets
- **Profile Page**: The consolidated user dashboard for deposits, withdrawals, and account management
- **Browse Page**: The project discovery interface where users find opportunities
- **Project Detail Page**: The detailed view of a single project with funding and bidding capabilities

## Requirements

### Requirement 1: USDC Payment Integration

**User Story:** As a user, I want all payments to be settled in USDC so that I can avoid cryptocurrency volatility and work with a stable currency.

#### Acceptance Criteria

1. WHEN a user funds a project, THE System SHALL accept payment in USDC only
2. WHEN a freelancer receives payment, THE System SHALL disburse funds in USDC
3. WHEN displaying balances, THE System SHALL show USDC amounts prominently with XLM as secondary
4. WHERE Trustless Work escrow is available, THE System SHALL use USDC-based escrow contracts
5. IF a user lacks USDC balance, THEN THE System SHALL provide clear guidance to deposit via the Profile page

### Requirement 2: Trustless Work Escrow Integration

**User Story:** As a project client, I want my funds secured in a Trustless Work escrow so that payments are released only when milestones are completed.

#### Acceptance Criteria

1. WHEN creating a project, THE System SHALL initialize a Trustless Work USDC escrow contract
2. WHEN a client funds a project, THE System SHALL deposit USDC into the escrow contract
3. WHEN a milestone is completed, THE System SHALL release the corresponding USDC amount to the freelancer
4. THE System SHALL display real-time escrow status including total locked, released, and available amounts
5. WHERE yield-bearing escrow is enabled, THE System SHALL display accumulated yield to the client

### Requirement 3: Simplified Browse Experience

**User Story:** As a user, I want to quickly browse available projects and see their funding status so that I can find opportunities that match my interests.

#### Acceptance Criteria

1. THE Browse Page SHALL display all active projects with title, description, budget, and funding progress
2. WHEN filtering projects, THE System SHALL support category-based filtering
3. WHEN searching projects, THE System SHALL match against title, description, and skills
4. THE Browse Page SHALL show USDC amounts for all budgets and funding levels
5. WHEN a user clicks a project, THE System SHALL navigate to the Project Detail Page

### Requirement 4: Unified Profile & Wallet Management

**User Story:** As a user, I want a single Profile page where I can manage deposits, withdrawals, and view my account so that I have one place for all financial operations.

#### Acceptance Criteria

1. THE Profile Page SHALL consolidate deposit (on-ramp), withdrawal (off-ramp), transaction history, and profile settings
2. WHEN depositing funds, THE System SHALL guide users through the anchor-based fiat-to-USDC conversion
3. WHEN withdrawing funds, THE System SHALL guide users through the USDC-to-fiat conversion
4. THE Profile Page SHALL display current USDC and XLM balances prominently
5. THE Profile Page SHALL show transaction history with deposit and withdrawal records

### Requirement 5: Project Funding Flow

**User Story:** As an investor, I want to fund projects with USDC so that I can support work I believe in and potentially earn returns.

#### Acceptance Criteria

1. WHEN viewing a project, THE System SHALL display a "Fund Project" button if funding is available
2. WHEN funding a project, THE System SHALL validate the user has sufficient USDC balance
3. IF the user lacks sufficient USDC, THEN THE System SHALL prompt them to deposit via Profile page
4. WHEN funding is submitted, THE System SHALL transfer USDC to the project's escrow contract
5. THE System SHALL update the project's funding progress in real-time after successful funding

### Requirement 6: Bidding and Escrow Assignment

**User Story:** As a freelancer, I want to submit cryptographically signed bids so that my proposals are verifiable and secure.

#### Acceptance Criteria

1. WHEN submitting a bid, THE System SHALL require wallet signature for verification
2. THE System SHALL validate bid amount does not exceed project budget
3. WHEN a bid is accepted, THE System SHALL assign the freelancer to the escrow contract
4. THE System SHALL display all verified bids with signature status on the Project Detail Page
5. WHERE a bid is unverified, THE System SHALL clearly indicate it as off-chain

### Requirement 7: Milestone Completion and Payment Release

**User Story:** As a client, I want to approve completed milestones so that freelancers receive payment for their work.

#### Acceptance Criteria

1. WHEN a milestone is in-progress, THE System SHALL display a "Mark as Complete" button to the client
2. WHEN marking a milestone complete, THE System SHALL call the escrow contract to release funds
3. THE System SHALL update milestone status to "completed" after successful release
4. THE System SHALL notify the freelancer when funds are available for withdrawal
5. THE System SHALL display released amounts in the freelancer's dashboard

### Requirement 8: Earnings Withdrawal

**User Story:** As a freelancer, I want to withdraw my earned USDC to my bank account so that I can access my earnings in fiat currency.

#### Acceptance Criteria

1. WHEN viewing the Profile page, THE System SHALL display total available USDC for withdrawal
2. WHEN initiating withdrawal, THE System SHALL show the user's released escrow funds
3. THE System SHALL provide a "Withdraw" button that navigates to the off-ramp flow
4. WHEN withdrawing, THE System SHALL guide users through anchor-based USDC-to-fiat conversion
5. THE System SHALL record withdrawal transactions in the transaction history

### Requirement 9: Dashboard Consolidation

**User Story:** As a user, I want a simplified dashboard that shows my active bids and investments so that I can track my activities without clutter.

#### Acceptance Criteria

1. THE Dashboard Page SHALL display active bids with escrow status and milestone progress
2. THE Dashboard Page SHALL display active investments with funding progress and returns
3. WHEN viewing a bid or investment, THE System SHALL provide a link to the related project
4. THE Dashboard Page SHALL show total earned and total invested amounts in USDC
5. THE System SHALL remove or consolidate redundant information from the dashboard

### Requirement 10: Responsive Error Handling

**User Story:** As a user, I want clear error messages when transactions fail so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a transaction fails, THE System SHALL display a user-friendly error message
2. THE System SHALL provide actionable guidance for common errors (insufficient balance, wallet not connected, etc.)
3. WHEN a wallet connection is required, THE System SHALL prompt the user to connect
4. THE System SHALL log detailed error information for debugging purposes
5. THE System SHALL handle network timeouts gracefully with retry options
