# Escrow Management UI Components

This directory contains React components for managing Stellar escrow contracts in the marketplace platform.

## Components

### 1. CreateEscrow (`create-escrow.tsx`)

A comprehensive form component for creating new escrow contracts with support for both milestone-based and time-based payment releases.

**Features:**
- Provider address input with validation
- Total amount input with balance checking
- Release type selector (milestone-based vs time-based)
- Dynamic milestone builder with add/remove functionality
- Time schedule builder with date/amount inputs
- Real-time validation and error handling
- Transaction confirmation modal
- Integration with EscrowService

**Usage:**
```tsx
import { CreateEscrow } from '@/components/escrow';

<CreateEscrow />
```

### 2. EscrowDashboard (`escrow-dashboard.tsx`)

A dashboard component that displays a list of user's escrow contracts with filtering, search, and pagination.

**Features:**
- Display list of escrow contracts (as client or provider)
- Filter by status (all, active, completed, disputed)
- Search by contract ID or address
- Real-time updates via watchEscrow
- Pagination for large lists
- Progress indicators for each contract
- Quick view of contract details

**Usage:**
```tsx
import { EscrowDashboard } from '@/components/escrow';

<EscrowDashboard />
```

### 3. EscrowDetails (`escrow-details.tsx`)

A detailed view component for individual escrow contracts showing all information, milestones/schedule, and transaction history.

**Features:**
- Display detailed escrow information
- Show milestone list with completion status
- Show time schedule with release dates
- Complete milestone button (for clients)
- Withdraw funds button (for providers)
- Transaction history with blockchain explorer links
- Real-time balance updates
- Contract information sidebar

**Usage:**
```tsx
import { EscrowDetails } from '@/components/escrow';

<EscrowDetails contractId="CAAAA..." />
```

### 4. DisputeResolution (`dispute-resolution.tsx`)

A component for managing disputes on escrow contracts, including initiation and viewing dispute history.

**Features:**
- Initiate dispute form with reason input
- Display dispute status and details
- Show dispute history
- Status indicators (open, resolved, rejected)
- Information about dispute process
- Role-based access control

**Usage:**
```tsx
import { DisputeResolution } from '@/components/escrow';

<DisputeResolution 
  contractId="CAAAA..." 
  currentStatus="active"
  userRole="client"
/>
```

## Integration

All components are integrated with:
- **Wallet Service**: Uses `useWallet` hook for wallet connection and balance
- **Escrow Service**: Interacts with Stellar smart contracts via `EscrowService`
- **Real-time Updates**: Subscribes to contract events for live updates
- **Toast Notifications**: Provides user feedback via `sonner`

## Dependencies

- `@/hooks/use-wallet` - Wallet connection and state management
- `@/lib/stellar/services/escrow` - Escrow contract interactions
- `@/lib/stellar/sdk` - Stellar SDK wrapper
- `@/components/ui/*` - UI component library
- `sonner` - Toast notifications
- `lucide-react` - Icons

## State Management

Components use local state with React hooks and subscribe to real-time blockchain events through the Stellar SDK's event streaming API.

## Validation

All forms include comprehensive validation:
- Address format validation (56 characters, starts with 'G')
- Amount validation (positive numbers, balance checks)
- Milestone/schedule validation (amounts sum to total)
- Date validation (future dates for time-based releases)

## Error Handling

Components handle errors gracefully with:
- User-friendly error messages
- Toast notifications for failures
- Loading states during async operations
- Retry logic in the SDK layer

## Styling

Components use Tailwind CSS with the project's design system:
- Consistent color scheme (green accents for success, yellow for warnings)
- Responsive design for mobile and desktop
- Dark mode support
- Accessible UI components from Radix UI

## Future Enhancements

- Multi-signature escrow support
- Automated dispute resolution
- Escrow templates for common use cases
- Export transaction history
- Email notifications for events
