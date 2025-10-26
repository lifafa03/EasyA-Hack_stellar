# Implementation Plan

- [x] 1. Update Trustless Work service integration
  - Enhance the existing `lib/stellar/trustless-work.ts` to support all required escrow operations
  - Add methods for bid submission, acceptance, and verification
  - Implement USDC-specific escrow creation with milestone configuration
  - Add error handling for Trustless Work API failures
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 2. Enhance wallet service for USDC operations
  - Update `lib/stellar/wallet.ts` to prioritize USDC balance display
  - Add USDC trustline establishment check and setup
  - Implement message signing for bid verification
  - Add balance refresh methods for real-time updates
  - _Requirements: 1.1, 1.3, 6.1, 8.2_

- [x] 3. Refactor Browse page for USDC display
  - Update `app/browse/page.tsx` to show all amounts in USDC
  - Ensure funding progress bars use USDC values
  - Update project cards to prominently display USDC budgets
  - Add loading states for project fetching
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Consolidate Profile page with deposit/withdraw flows
  - Refactor `app/profile/page.tsx` to include all wallet operations in tabs
  - Move deposit (on-ramp) flow into Profile → Deposit tab
  - Move withdrawal (off-ramp) flow into Profile → Withdraw tab
  - Add transaction history tab with filtering
  - Display USDC balance prominently at the top
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Update Project Detail page with Trustless Work escrow
  - Modify `app/project/[id]/page.tsx` to fetch escrow status from Trustless Work
  - Update Escrow tab to show USDC amounts and contract details
  - Add "Fund Project" flow that validates USDC balance
  - Implement "Place Bid" with wallet signature requirement
  - Add milestone completion flow for clients
  - Add withdrawal flow for freelancers with released funds
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [-] 6. Implement bid signing and verification
  - Update `lib/stellar/contracts.ts` bid signing to use wallet message signing
  - Add bid verification logic that checks signature validity
  - Create UI components to display verified vs unverified bids
  - Add bid submission flow with signature confirmation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Simplify Dashboard page
  - Refactor `app/dashboard/page.tsx` to remove deposit/withdraw functionality
  - Keep only "My Bids" and "My Investments" tabs
  - Update stats cards to show USDC amounts
  - Add links to Profile page for deposit/withdraw actions
  - Remove redundant escrow management (keep in Project Detail)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8. Add USDC balance validation across all payment flows
  - Create a reusable balance check utility
  - Add pre-transaction validation for funding projects
  - Add pre-transaction validation for placing bids
  - Show "Insufficient USDC" errors with link to Profile → Deposit
  - Display available balance in all payment modals
  - _Requirements: 1.5, 5.3, 8.2, 10.1, 10.2, 10.3_

- [ ] 9. Implement milestone release and withdrawal flows
  - Add "Mark as Complete" button for clients on in-progress milestones
  - Integrate with Trustless Work API to release milestone funds
  - Add "Withdraw Funds" button for freelancers with released amounts
  - Show real-time updates after milestone completion
  - Display transaction confirmation with blockchain explorer links
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10. Update all monetary displays to show USDC
  - Replace all `$` displays with `$ USDC` format
  - Update balance displays in navigation/header
  - Update project cards, detail pages, and dashboard
  - Show XLM balance as secondary (smaller, muted)
  - Ensure consistent formatting across the app
  - _Requirements: 1.1, 1.2, 1.3, 3.4_

- [ ] 11. Enhance error handling and user feedback
  - Create centralized error handler component
  - Add user-friendly error messages for common failures
  - Implement wallet connection prompts when needed
  - Add loading states for all async operations
  - Show transaction progress indicators
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Add transaction history to Profile page
  - Create transaction history component with filtering
  - Fetch deposit and withdrawal records from storage
  - Display transaction status (pending, completed, failed)
  - Add links to blockchain explorer for completed transactions
  - Implement pagination for large transaction lists
  - _Requirements: 4.5, 8.5_

- [ ]* 13. Optimize performance with caching and lazy loading
  - Implement client-side caching for project lists
  - Add lazy loading for project images
  - Implement pagination for transaction history
  - Add code splitting for route-based components
  - Cache escrow status with appropriate TTL
  - _Requirements: N/A (Performance optimization)_

- [ ]* 14. Add WebSocket support for real-time updates
  - Implement WebSocket connection for escrow status updates
  - Add real-time funding progress updates
  - Show live milestone completion notifications
  - Update balance displays in real-time
  - _Requirements: 2.4, 5.5, 7.4_

- [ ]* 15. Create comprehensive error boundary components
  - Add error boundaries for each major page
  - Implement fallback UI for component errors
  - Add error logging for debugging
  - Create retry mechanisms for failed operations
  - _Requirements: 10.1, 10.4_

- [ ]* 16. Add integration tests for core flows
  - Test browse → view → fund project flow
  - Test browse → view → place bid flow
  - Test profile deposit flow
  - Test dashboard → milestone completion → withdrawal flow
  - Test profile withdrawal flow
  - _Requirements: All (Testing)_
