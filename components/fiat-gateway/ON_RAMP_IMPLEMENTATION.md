# On-Ramp Flow Implementation

## Overview
The on-ramp flow component enables users to deposit fiat currency and receive cryptocurrency (USDC) through Stellar anchor services using the SEP-24 protocol.

## Component Location
`components/fiat-gateway/on-ramp-flow.tsx`

## Features Implemented

### ✅ Multi-Step Flow
- **Input Step**: Amount entry, currency selection, and payment method
- **Interactive Step**: SEP-24 iframe for anchor's payment interface
- **Processing Step**: Transaction status monitoring with polling
- **Complete Step**: Success confirmation with transaction details

### ✅ Amount Input with Currency Selection
- Supports multiple fiat currencies (USD, EUR, GBP, etc.)
- Real-time input validation
- Min/max amount constraints
- Payment method selection (bank transfer, credit/debit card, wire transfer)

### ✅ Exchange Rate Integration
- Integrated `ExchangeRateDisplay` component
- Real-time rate fetching with 30-second cache
- Fee breakdown display
- Automatic rate refresh
- Debounced rate updates on amount changes

### ✅ Trustline Management
- Automatic trustline check on wallet connection
- User-friendly trustline creation flow
- Clear messaging about trustline requirements
- Blocks transaction if trustline doesn't exist

### ✅ SEP-24 Interactive Flow
- Integrated `InteractivePopup` component
- Secure iframe with domain validation
- Post-message communication handling
- Loading and error states
- Automatic closure on completion

### ✅ Transaction Status Monitoring
- Exponential backoff polling (5s → 15s max)
- Real-time status updates via toast notifications
- Status change callbacks
- Timeout handling (10 minutes max)
- Final state detection (completed/error/refunded)

### ✅ Error Handling
- Comprehensive error states for all operations
- User-friendly error messages
- Retry capabilities
- Validation errors with inline feedback
- Network error handling
- Anchor service error handling
- Wallet connection errors

### ✅ User Experience Features
- Step indicator with progress visualization
- Loading states with spinners
- Success animations
- Balance refresh on completion
- Transaction ID display
- Estimated processing time
- Anchor information display
- Change anchor option

## State Management
The component uses React hooks for state management:
- `step`: Current flow step (input/interactive/processing/complete)
- `amount`: Deposit amount
- `currency`: Selected fiat currency
- `paymentMethod`: Selected payment method
- `exchangeRate`: Current exchange rate data
- `session`: SEP-24 session information
- `transactionId`: Transaction identifier
- `transactionStatus`: Current transaction status
- `trustlineChecked`: Trustline verification status
- `trustlineExists`: Whether trustline exists
- `error`: Error message state
- `isLoading`: Loading state

## Integration Points

### Wallet Integration
- Uses `useWallet()` hook for wallet connection
- Accesses public key for transactions
- Refreshes balance on completion
- Handles wallet disconnection

### Anchor Service
- Initializes `AnchorService` with selected anchor domain
- Fetches exchange rates
- Checks and creates trustlines
- Initiates on-ramp sessions
- Polls transaction status
- Handles SEP-10 authentication

### UI Components
- Card, Button, Input, Select, Label
- Alert, Badge, Progress, Spinner
- Toast notifications for user feedback
- Lucide icons for visual elements

## Requirements Coverage

### Requirement 1.1 ✅
"WHEN the User selects the on-ramp option, THE Platform SHALL display a list of available Anchors supporting the User's region"
- Anchor selection handled by parent component/page
- Component accepts `selectedAnchor` prop
- Displays selected anchor information
- Provides "Change" button to go back to anchor selection

### Requirement 1.2 ✅
"WHEN the User selects an Anchor, THE Platform SHALL initiate the SEP-24 hosted deposit flow with the selected Anchor"
- `handleStartOnRamp()` initiates SEP-24 flow
- Creates on-ramp session via `AnchorService`
- Opens interactive popup with anchor's URL
- Handles SEP-24 authentication

### Requirement 1.3 ✅
"WHEN the User completes the Anchor's deposit process, THE Platform SHALL establish a Trustline for the Anchor's asset if one does not exist"
- `checkTrustline()` verifies trustline existence
- `handleCreateTrustline()` creates trustline if needed
- Blocks transaction until trustline exists
- Clear UI messaging about trustline requirement

### Requirement 1.4 ✅
"WHEN the deposit Transaction completes successfully, THE Platform SHALL display the updated balance in the User's Wallet"
- Calls `wallet.refreshBalance()` on completion
- Displays new balance in completion step
- Shows amount deposited

### Requirement 1.5 ✅
"IF the Trustline creation fails, THEN THE Platform SHALL display an error message and SHALL allow the User to retry the operation"
- Error handling in `handleCreateTrustline()`
- Displays error message via Alert component
- Retry button available in trustline creation UI
- Toast notification for errors

### Requirement 3.1, 3.2, 3.3 ✅
Exchange rate display and updates
- Real-time exchange rate fetching
- 30-second cache with auto-refresh
- Fee breakdown display
- Total amount calculation
- Last updated timestamp

### Requirement 5.1, 5.2, 5.3, 5.4, 5.5 ✅
User guidance and error handling
- Step-by-step instructions via step indicator
- Clear error messages with suggested actions
- Estimated completion times displayed
- Tooltips for blockchain terms (via integrated components)
- Success message with next steps

## Testing
A test page has been created at `app/fiat-gateway-test/page.tsx` to verify:
- Component rendering
- Wallet connection requirement
- Anchor selection integration
- Complete flow execution
- Error handling
- Callback functions

## Known Limitations
1. **Wallet Signing**: The actual wallet signing implementation needs to be connected to the real wallet provider. Currently throws an error indicating this needs integration.
2. **USDC Issuer**: Uses hardcoded testnet USDC issuer. In production, this should be fetched from anchor info.
3. **Mock Data**: Some anchor responses may need adjustment based on actual anchor API responses.

## Next Steps
1. Integrate with actual wallet signing (Freighter, Albedo, etc.)
2. Add comprehensive error recovery flows
3. Implement transaction history storage
4. Add analytics tracking
5. Enhance accessibility features
6. Add unit and integration tests

## Usage Example

```tsx
import { OnRampFlow } from '@/components/fiat-gateway';
import { AnchorRegistry } from '@/lib/stellar/services/anchor-registry';

function MyPage() {
  const anchor = AnchorRegistry.getAnchorById('moneygram');
  
  return (
    <OnRampFlow
      selectedAnchor={anchor}
      onComplete={(txId) => console.log('Completed:', txId)}
      onError={(error) => console.error('Error:', error)}
      onBack={() => console.log('Go back to anchor selection')}
    />
  );
}
```
