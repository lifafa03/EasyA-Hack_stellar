# 🌟 StellarWork+ - Decentralized Freelance Marketplace

> Where Work Meets Funding on the Stellar Blockchain

**StellarWork+** is a revolutionary three-sided marketplace connecting businesses, freelancers, and investors through trustless escrow contracts powered by Stellar and integrated with Trustless Work infrastructure.

![Status](https://img.shields.io/badge/status-development-yellow)
![Blockchain](https://img.shields.io/badge/blockchain-Stellar-blue)
![Network](https://img.shields.io/badge/network-testnet-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Stellar Integration](#-stellar-integration)
- [Trustless Work Integration](#-trustless-work-integration)
- [Validation & Auto-Correction](#-validation--auto-correction)
- [Documentation](#-documentation)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Platform

- **Three-Sided Marketplace**: Businesses post projects, freelancers bid, investors fund
- **Milestone-Based Payments**: Projects broken into verifiable milestones with escrow protection
- **Transparent Funding**: Real-time funding progress and blockchain verification
- **Smart Bidding System**: On-chain bid proposals with signature verification
- **Investor Pooling**: Multiple investors can fund projects collaboratively

### 🔐 Blockchain Features

- **Trustless Escrow**: Smart contracts hold funds securely until milestones approved
- **Wallet Integration**: Freighter and Albedo wallet support
- **USDC Payments**: Stable cryptocurrency payments via Stellar
- **Yield-Bearing Escrows**: Earn interest while funds locked in escrow
- **On-Chain Verification**: All transactions verifiable on Stellar blockchain
- **Real-Time Sync**: Live updates from blockchain without page refresh

### 🛡️ Security & Validation

- **5-Layer Checkpoint System**: Validates all operations before execution
- **Auto-Correction**: Automatically fixes common errors (sequence, fees, etc.)
- **Auto-Retry**: Failed transactions retry with exponential backoff
- **Comprehensive Error Handling**: User-friendly error messages with solutions
- **Transaction Preview**: Review all details before signing
- **Balance Validation**: Checks sufficient funds before transactions

---

## 🚀 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Shadcn/ui** - Beautiful component library

### Blockchain
- **Stellar SDK** - Blockchain interactions
- **Soroban** - Smart contracts on Stellar
- **Freighter API** - Wallet connectivity
- **Trustless Work** - Escrow infrastructure

### State & Data
- **React Hooks** - Custom hooks for wallet and escrow state
- **Context API** - Global state management
- **Axios** - HTTP client for Trustless Work API

### Development
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Sonner** - Toast notifications

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and **npm** installed
2. **Stellar wallet** (Freighter or Albedo)
3. **Testnet XLM** and **USDC** (get from faucets)

### Installation

```bash
# Clone repository
cd /Users/solipuram.rohanreddy/Desktop/EasyA-Hack_stellar

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Visit http://localhost:3000

### Get Testnet Funds

1. Install Freighter: https://freighter.app
2. Switch to Testnet in settings
3. Get XLM: https://laboratory.stellar.org/#account-creator
4. Add USDC trustline and request from faucet

---

## 📦 Installation

### Detailed Setup Guide

See **[STELLAR_INTEGRATION_GUIDE.md](./STELLAR_INTEGRATION_GUIDE.md)** for comprehensive setup instructions including:
- Node.js installation
- Wallet setup
- Testnet funding
- Environment configuration
- Troubleshooting

### Environment Variables

Create `.env.local` with:

```env
# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Trustless Work
NEXT_PUBLIC_TRUSTLESS_WORK_API=https://api.trustlesswork.com
NEXT_PUBLIC_TRUSTLESS_WORK_CONTRACT=<CONTRACT_ID>

# USDC
NEXT_PUBLIC_USDC_ASSET_CODE=USDC
NEXT_PUBLIC_USDC_ISSUER=<ISSUER_ADDRESS>
```

---

## 📁 Project Structure

```
StellarWork+/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home page with featured projects
│   ├── layout.tsx                # Root layout with providers
│   ├── browse/                   # Browse all projects
│   ├── post-project/             # Create new project
│   ├── project/[id]/             # Project detail & bidding
│   ├── dashboard/                # User dashboard
│   ├── my-bids/                  # Freelancer bids
│   └── my-investments/           # Investor portfolio
│
├── components/                   # React components
│   ├── wallet-connect.tsx        # Wallet connection UI
│   ├── navigation.tsx            # Top navigation bar
│   ├── gradient-background.tsx   # Animated backgrounds
│   └── ui/                       # Shadcn UI components
│
├── lib/                          # Utility libraries
│   ├── stellar/                  # Stellar blockchain integration
│   │   ├── config.ts             # Network configuration
│   │   ├── wallet.ts             # Wallet operations
│   │   ├── trustless-work.ts     # Escrow management
│   │   ├── contracts.ts          # Smart contract utils
│   │   └── validation.ts         # Checkpoint system
│   └── utils.ts                  # General utilities
│
├── hooks/                        # Custom React hooks
│   ├── use-wallet.ts             # Wallet state management
│   └── use-toast.ts              # Toast notifications
│
├── public/                       # Static assets
├── styles/                       # Global styles
│
├── .env.local                    # Environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
│
├── STELLAR_INTEGRATION_GUIDE.md  # Setup guide
├── GLM_PROMPTS.md                # AI prompting guide
└── README.md                     # This file
```

---

## ⛓️ Stellar Integration

### Wallet Connectivity

```typescript
import { useWallet } from '@/hooks/use-wallet';

function Component() {
  const wallet = useWallet();
  
  // Connect wallet
  await wallet.connect('freighter');
  
  // Access wallet data
  console.log(wallet.publicKey);
  console.log(wallet.balance); // XLM
  console.log(wallet.usdcBalance); // USDC
  
  // Disconnect
  wallet.disconnect();
}
```

### Creating Escrows

```typescript
import { createEscrow } from '@/lib/stellar/trustless-work';

const escrow = await createEscrow({
  clientAddress: 'GXXX...',
  freelancerAddress: 'GYYY...',
  totalBudget: 1000,
  milestones: [
    { title: 'Design', budget: 400, description: '...' },
    { title: 'Development', budget: 600, description: '...' }
  ],
  projectId: 'project-123',
  currency: 'USDC',
  enableYield: true
});

console.log(escrow.escrowId);
console.log(escrow.contractAddress);
```

### Validation Checkpoints

```typescript
import { validateWalletConnection, validateEscrowCreation } from '@/lib/stellar/validation';

// Validate wallet
const walletCheck = await validateWalletConnection(publicKey);
if (!walletCheck.success) {
  console.error(walletCheck.errors);
}

// Validate escrow params
const escrowCheck = await validateEscrowCreation({
  clientAddress,
  freelancerAddress,
  budget: 1000,
  milestones
});

if (!escrowCheck.success) {
  console.error(escrowCheck.errors);
}
```

---

## 🤝 Trustless Work Integration

### API Integration

StellarWork+ integrates with Trustless Work for:
- **Escrow Creation**: Deploy escrow smart contracts
- **Milestone Management**: Track and release payments
- **Yield Generation**: Earn interest on locked funds
- **Dispute Resolution**: Handle conflicts on-chain

### Key Functions

```typescript
import {
  createEscrow,
  fundEscrow,
  releaseMilestone,
  getEscrowStatus,
  getEscrowYield
} from '@/lib/stellar/trustless-work';

// Create escrow
const escrow = await createEscrow(params);

// Fund project
await fundEscrow(escrowId, amount, investorAddress);

// Release milestone
await releaseMilestone(escrowId, milestoneId, clientAddress);

// Check status
const status = await getEscrowStatus(escrowId);

// Get yield data
const yield = await getEscrowYield(escrowId);
console.log(`APY: ${yield.apy}%, Earned: ${yield.earned} USDC`);
```

### Yield-Bearing Escrows

Enable `enableYield: true` when creating escrow to activate TrustYield integration:

```typescript
const escrow = await createEscrow({
  // ... other params
  enableYield: true  // Earn yield while funds locked
});
```

---

## ✅ Validation & Auto-Correction

### Checkpoint System

StellarWork+ includes 5 validation checkpoints that auto-correct common errors:

#### 1️⃣ Wallet Connection Validation
- ✅ Validates public key format
- ✅ Checks account exists on network
- ✅ Verifies sufficient balance
- 🔧 **Auto-correction**: Shows funding instructions if account doesn't exist

#### 2️⃣ Transaction Validation
- ✅ Validates transaction structure
- ✅ Checks sequence numbers
- ✅ Verifies fee amounts
- 🔧 **Auto-correction**: Rebuilds transaction with correct sequence

#### 3️⃣ Escrow Creation Validation
- ✅ Validates client/freelancer addresses
- ✅ Checks budget amounts
- ✅ Validates milestone structure
- ✅ Verifies client balance
- 🔧 **Auto-correction**: Suggests budget adjustments if insufficient

#### 4️⃣ Auto-Retry System
- ✅ Retries failed operations 3 times
- ✅ Exponential backoff (2 seconds delay)
- ✅ Shows progress to user
- 🔧 **Auto-correction**: Handles temporary network issues

#### 5️⃣ Contract Call Validation
- ✅ Validates contract ID format
- ✅ Checks method names
- ✅ Validates arguments
- 🔧 **Auto-correction**: Provides helpful error messages

### Usage

```typescript
import { executeWithRetry, runCheckpoints } from '@/lib/stellar/validation';

// Auto-retry operation
const result = await executeWithRetry(
  async () => createEscrow(params),
  { maxRetries: 3, retryDelay: 2000, autoCorrect: true }
);

// Run multiple checkpoints
const { allPassed, results } = await runCheckpoints([
  () => validateWalletConnection(publicKey),
  () => validateTransaction(tx),
  () => validateEscrowCreation(params)
]);
```

---

## 📚 Documentation

### Guides

- **[STELLAR_INTEGRATION_GUIDE.md](./STELLAR_INTEGRATION_GUIDE.md)** - Complete setup and integration guide
- **[GLM_PROMPTS.md](./GLM_PROMPTS.md)** - AI prompting strategies for development

### Resources

- **Stellar Docs**: https://developers.stellar.org
- **Soroban Docs**: https://soroban.stellar.org
- **Trustless Work**: https://github.com/Trustless-Work
- **Freighter Wallet**: https://freighter.app

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

### Adding New Features

See **[GLM_PROMPTS.md](./GLM_PROMPTS.md)** for optimized prompts to use with GLM 4.6 AI for building new features.

Example workflow:
1. Choose feature prompt from GLM_PROMPTS.md
2. Customize with your requirements
3. Generate code with GLM 4.6
4. Test with checkpoint validation
5. Verify on Stellar testnet

### Testing

```bash
# Run checkpoint validation
npm run test:checkpoints

# Test wallet connection
# 1. Start dev server
# 2. Click "Connect Wallet"
# 3. Check console for checkpoint logs

# Test escrow creation
# 1. Connect wallet
# 2. Fill post-project form
# 3. Submit and check validation
# 4. Verify on Stellar Expert
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code patterns** from existing files
4. **Add checkpoint validation** for new features
5. **Test thoroughly** on testnet
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open Pull Request**

### Code Standards

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for functions
- Include error handling and validation
- Test with checkpoint system
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For the amazing blockchain platform
- **Trustless Work** - For the escrow infrastructure
- **Freighter Team** - For the wallet integration
- **Shadcn** - For beautiful UI components
- **Vercel** - For Next.js and deployment platform

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/lifafa03/EasyA-Hack_stellar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/lifafa03/EasyA-Hack_stellar/discussions)
- **Stellar Community**: [Stellar Discord](https://discord.gg/stellar)

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Project structure and UI/UX
- [x] Stellar SDK integration
- [x] Wallet connectivity (Freighter/Albedo)
- [x] Trustless Work escrow integration
- [x] Smart contract interaction layer
- [x] Validation checkpoint system
- [x] Auto-correction and retry logic
- [x] Documentation and guides

### 🚧 In Progress
- [ ] Real escrow deployment on post-project
- [ ] USDC payment system with trustlines
- [ ] Real-time blockchain data sync

### 📋 Planned
- [ ] On-chain bidding system
- [ ] Yield-bearing investor pooling
- [ ] Dispute resolution UI
- [ ] Reputation system
- [ ] Mobile app (React Native)
- [ ] Mainnet deployment

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with ❤️ for the decentralized future of work**

*StellarWork+ - Where Work Meets Funding on Stellar* 🚀
