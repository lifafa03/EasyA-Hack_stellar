# Stellar Components

This directory contains all Stellar blockchain-related UI components for branding, education, and blockchain interaction.

## Components Overview

### Branding Components

#### `StellarLogo`
Displays the Stellar logo with optional text.

```tsx
import { StellarLogo } from "@/components/stellar"

<StellarLogo size="md" showText={true} />
```

**Props:**
- `size`: "sm" | "md" | "lg" - Logo size
- `showText`: boolean - Show "Powered by Stellar" text
- `className`: string - Additional CSS classes

#### `StellarBadge`
A clickable badge linking to Stellar.org.

```tsx
import { StellarBadge } from "@/components/stellar"

<StellarBadge />
```

### Loading States

#### `StellarLoading`
Branded loading spinner with Stellar logo.

```tsx
import { StellarLoading } from "@/components/stellar"

<StellarLoading size="md" message="Processing..." />
```

**Props:**
- `size`: "sm" | "md" | "lg" - Spinner size
- `message`: string - Optional loading message
- `className`: string - Additional CSS classes

#### `StellarTransactionLoading`
Specialized loading state for blockchain transactions.

```tsx
import { StellarTransactionLoading } from "@/components/stellar"

<StellarTransactionLoading />
```

### Educational Components

#### `BlockchainTooltip`
Interactive tooltip explaining blockchain terms.

```tsx
import { BlockchainTooltip } from "@/components/stellar"

<p>
  This uses <BlockchainTooltip term="escrow" /> to protect payments.
</p>
```

**Props:**
- `term`: string - Blockchain term to explain (see list below)
- `children`: ReactNode - Optional custom display text
- `className`: string - Additional CSS classes

**Supported Terms:**
- escrow, milestone, smart contract, wallet, blockchain
- stellar, soroban, transaction hash, lumens
- testnet, mainnet, public key, private key
- crowdfunding, anchor, on-ramp, off-ramp

#### `StellarFAQ`
Comprehensive FAQ about Stellar transactions.

```tsx
import { StellarFAQ } from "@/components/stellar"

<StellarFAQ />
```

#### `OnboardingFlow`
Multi-step onboarding dialog for new users.

```tsx
import { OnboardingFlow } from "@/components/stellar"

const [showOnboarding, setShowOnboarding] = useState(false)

<OnboardingFlow
  open={showOnboarding}
  onOpenChange={setShowOnboarding}
  onComplete={() => console.log("Completed")}
/>
```

**Props:**
- `open`: boolean - Dialog open state
- `onOpenChange`: (open: boolean) => void - State change handler
- `onComplete`: () => void - Called when user completes onboarding

### Explorer Links

#### `TransactionHash`
Display transaction hash with copy and explorer link.

```tsx
import { TransactionHash } from "@/components/stellar"

<TransactionHash
  hash="abc123..."
  network="testnet"
  showCopy={true}
  showExplorer={true}
  truncate={true}
/>
```

**Props:**
- `hash`: string - Transaction hash
- `network`: "testnet" | "mainnet" - Stellar network
- `showCopy`: boolean - Show copy button
- `showExplorer`: boolean - Show explorer link
- `truncate`: boolean - Truncate hash display
- `className`: string - Additional CSS classes

#### `AccountLink`
Link to account on Stellar Expert.

```tsx
import { AccountLink } from "@/components/stellar"

<AccountLink
  address="GBRPYHIL..."
  network="testnet"
  truncate={true}
/>
```

#### `ContractLink`
Link to smart contract on Stellar Expert.

```tsx
import { ContractLink } from "@/components/stellar"

<ContractLink
  contractId="CAAAA..."
  network="testnet"
  truncate={true}
/>
```

#### `ExplorerLinks`
Card displaying multiple explorer links.

```tsx
import { ExplorerLinks } from "@/components/stellar"

<ExplorerLinks
  transactionHash="abc123..."
  accountAddress="GBRPYHIL..."
  contractId="CAAAA..."
  network="testnet"
/>
```

#### `QuickExplorerButton`
Quick button to open explorer.

```tsx
import { QuickExplorerButton } from "@/components/stellar"

<QuickExplorerButton
  type="transaction"
  id="abc123..."
  network="testnet"
  label="View Transaction"
/>
```

### Network Status

#### `NetworkStatus`
Full network health dashboard.

```tsx
import { NetworkStatus } from "@/components/stellar"

<NetworkStatus compact={false} />
```

**Props:**
- `compact`: boolean - Show compact version
- `className`: string - Additional CSS classes

**Features:**
- Network type (testnet/mainnet)
- Average confirmation time
- Current base fee
- API latency
- Health status

#### `NetworkIndicator`
Compact network badge for navigation.

```tsx
import { NetworkIndicator } from "@/components/stellar"

<NetworkIndicator />
```

### Layout Components

#### `Footer`
Application footer with Stellar branding.

```tsx
import { Footer } from "@/components/stellar"

<Footer />
```

**Features:**
- Stellar badge
- Platform links
- Resource links
- Legal links

## Usage Examples

### Adding Stellar Branding to a Page

```tsx
import { StellarBadge, StellarLogo } from "@/components/stellar"

export default function MyPage() {
  return (
    <div>
      <StellarLogo size="lg" />
      <h1>My Feature</h1>
      <p>Content here...</p>
      <StellarBadge />
    </div>
  )
}
```

### Showing Transaction Details

```tsx
import { TransactionHash, ExplorerLinks } from "@/components/stellar"

export default function TransactionDetails({ tx }) {
  return (
    <div>
      <h2>Transaction Complete</h2>
      <TransactionHash hash={tx.hash} network="testnet" />
      
      <ExplorerLinks
        transactionHash={tx.hash}
        accountAddress={tx.from}
        network="testnet"
      />
    </div>
  )
}
```

### Adding Educational Content

```tsx
import { BlockchainTooltip, StellarFAQ } from "@/components/stellar"

export default function HelpPage() {
  return (
    <div>
      <p>
        Your funds are held in <BlockchainTooltip term="escrow" /> 
        using <BlockchainTooltip term="smart contract">smart contracts</BlockchainTooltip>.
      </p>
      
      <StellarFAQ />
    </div>
  )
}
```

### Implementing Onboarding

```tsx
"use client"

import { useState, useEffect } from "react"
import { OnboardingFlow } from "@/components/stellar"

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [])
  
  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
  }
  
  return (
    <>
      {/* Your app content */}
      
      <OnboardingFlow
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleComplete}
      />
    </>
  )
}
```

## Demo Page

Visit `/stellar-demo` to see all components in action.

## Network Configuration

Components automatically detect the network from environment variables:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

For mainnet:

```env
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org
```

## Styling

All components use Tailwind CSS and respect the application's theme (light/dark mode). They integrate seamlessly with the existing UI component library.

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation is fully supported
- Color contrast meets WCAG AA standards
- Screen reader friendly
