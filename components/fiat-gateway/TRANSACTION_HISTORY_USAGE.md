# Transaction History Component

## Overview

The `TransactionHistory` component provides a comprehensive interface for viewing, filtering, and exporting fiat gateway transaction history. It displays both on-ramp (deposit) and off-ramp (withdrawal) transactions with detailed information and filtering capabilities.

## Features

- **Filterable Transaction List**: Filter by type (on-ramp/off-ramp), status, date range, and search query
- **Transaction Cards**: Expandable cards showing key transaction details
- **Status Badges**: Visual indicators for transaction status
- **Stellar Explorer Links**: Direct links to view transactions on Stellar blockchain explorer
- **Export Functionality**: Export transaction data to CSV or JSON format
- **Responsive Design**: Works on desktop and mobile devices
- **Date Range Filtering**: Filter by last 7, 30, or 90 days

## Usage

```tsx
import { TransactionHistory } from "@/components/fiat-gateway/transaction-history"
import { FiatTransaction } from "@/lib/stellar/types/fiat-gateway"

// Example with transaction data
const transactions: FiatTransaction[] = [
  {
    id: "tx_123",
    type: "on-ramp",
    status: "completed",
    amount: "100.00",
    currency: "USD",
    cryptoAmount: "99.50",
    cryptoCurrency: "USDC",
    exchangeRate: "1.00",
    fees: "0.50",
    anchorId: "moneygram",
    anchorName: "MoneyGram Access",
    stellarTxHash: "abc123...",
    createdAt: Date.now(),
    completedAt: Date.now() + 30 * 60 * 1000,
  },
  // ... more transactions
]

function MyPage() {
  return (
    <TransactionHistory 
      transactions={transactions}
      network="testnet" // or "mainnet"
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transactions` | `FiatTransaction[]` | required | Array of transaction objects to display |
| `network` | `"testnet" \| "mainnet"` | `"testnet"` | Stellar network for explorer links |
| `className` | `string` | `undefined` | Additional CSS classes |

## Transaction Object

```typescript
interface FiatTransaction {
  id: string                      // Unique transaction ID
  type: TransactionType           // "on-ramp" or "off-ramp"
  status: TransactionStatus       // Current transaction status
  amount: string                  // Fiat amount
  currency: string                // Fiat currency code (e.g., "USD")
  cryptoAmount: string            // Cryptocurrency amount
  cryptoCurrency: string          // Crypto currency code (e.g., "USDC")
  exchangeRate: string            // Exchange rate used
  fees: string                    // Transaction fees
  anchorId: string                // Anchor provider ID
  anchorName: string              // Anchor provider name
  stellarTxHash?: string          // Stellar transaction hash (optional)
  externalTxId?: string           // External transaction ID (optional)
  createdAt: number               // Creation timestamp (ms)
  completedAt?: number            // Completion timestamp (ms, optional)
  errorMessage?: string           // Error message if failed (optional)
}
```

## Transaction Statuses

The component supports the following transaction statuses:

- `pending_user_transfer_start` - Awaiting Payment
- `pending_user_transfer_complete` - Payment Received
- `pending_external` - Processing
- `pending_anchor` - Anchor Processing
- `pending_stellar` - Stellar Transaction
- `pending_trust` - Awaiting Trustline
- `pending_user` - Action Required
- `completed` - Completed
- `error` - Failed
- `expired` - Expired
- `refunded` - Refunded

## Filtering

The component provides four types of filters:

1. **Search**: Search by transaction ID, anchor name, or transaction hashes
2. **Type Filter**: Filter by on-ramp (deposits) or off-ramp (withdrawals)
3. **Status Filter**: Filter by transaction status
4. **Date Range**: Filter by last 7, 30, or 90 days, or all time

## Export Functionality

Users can export filtered transaction data in two formats:

- **CSV**: Comma-separated values file for spreadsheet applications
- **JSON**: JSON format for programmatic processing

The export includes all transaction details and respects current filters.

## Expandable Details

Each transaction card can be expanded to show:

- Exchange rate
- Transaction fees
- Anchor provider
- Transaction ID
- Completion timestamp
- Error messages (if applicable)
- Stellar transaction hash with explorer link
- External transaction ID

## Integration Example

```tsx
"use client"

import { useState, useEffect } from "react"
import { TransactionHistory } from "@/components/fiat-gateway/transaction-history"
import { FiatTransaction } from "@/lib/stellar/types/fiat-gateway"

export default function FiatGatewayPage() {
  const [transactions, setTransactions] = useState<FiatTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load transactions from localStorage or API
    const loadTransactions = async () => {
      try {
        const stored = localStorage.getItem("fiat_transactions")
        if (stored) {
          setTransactions(JSON.parse(stored))
        }
      } catch (error) {
        console.error("Failed to load transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <TransactionHistory 
        transactions={transactions}
        network="testnet"
      />
    </div>
  )
}
```

## Styling

The component uses existing UI components from the design system:

- `Card` - For container and transaction cards
- `Button` - For actions and filters
- `Badge` - For status indicators
- `Select` - For dropdown filters
- `Input` - For search functionality

All styling follows the existing design system and supports dark mode.

## Requirements Satisfied

This component satisfies the following requirements from the spec:

- **4.1**: Display all completed on-ramp and off-ramp transactions
- **4.2**: Display transaction details (timestamp, amount, currency, status, hash)
- **4.3**: Show detailed information when transaction is selected
- **4.4**: Filter transactions by type, date range, and status
- **4.5**: Provide link to view transaction on Stellar blockchain explorer

## Testing

A test page is available at `/test-transaction-history` with mock transaction data to verify the component functionality.
