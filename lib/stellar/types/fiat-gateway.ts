/**
 * Type definitions for Fiat Gateway (On/Off-Ramp) functionality
 */

// Transaction status types
export type TransactionStatus = 
  | 'pending_user_transfer_start'
  | 'pending_user_transfer_complete'
  | 'pending_external'
  | 'pending_anchor'
  | 'pending_stellar'
  | 'pending_trust'
  | 'pending_user'
  | 'completed'
  | 'error'
  | 'expired'
  | 'refunded';

export type TransactionType = 'on-ramp' | 'off-ramp';

// Fiat transaction record
export interface FiatTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  currency: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  exchangeRate: string;
  fees: string;
  anchorId: string;
  anchorName: string;
  stellarTxHash?: string;
  externalTxId?: string;
  createdAt: number;
  completedAt?: number;
  errorMessage?: string;
}

// Bank account information
export interface BankAccountInfo {
  accountNumber?: string;
  routingNumber?: string;
  accountType?: 'checking' | 'savings';
  bankName?: string;
  swiftCode?: string;
  iban?: string;
}

// User preferences for fiat gateway
export interface UserFiatPreferences {
  userId: string;
  preferredAnchor: string;
  defaultCurrency: string;
  savedBankAccounts: BankAccountInfo[];
  transactionHistory: FiatTransaction[];
}

// Exchange rate information
export interface ExchangeRate {
  rate: string;
  sourceCurrency: string;
  targetCurrency: string;
  fee: string;
  totalAmount: string;
  lastUpdated: number;
}

// SEP-24 session information
export interface OnRampSession {
  id: string;
  url: string;
  token?: string;
  expiresAt?: number;
}

export interface OffRampSession {
  id: string;
  url: string;
  token?: string;
  expiresAt?: number;
}

// On-ramp flow state management
export type OnRampStep = 'input' | 'interactive' | 'processing' | 'complete';

export interface OnRampState {
  step: OnRampStep;
  amount: string;
  currency: string;
  selectedAnchor: AnchorProvider | null;
  exchangeRate: ExchangeRate | null;
  session: OnRampSession | null;
  transactionId?: string;
  error: string | null;
  isLoading: boolean;
}

// Off-ramp flow state management
export type OffRampStep = 'input' | 'bank-info' | 'interactive' | 'processing' | 'complete';

export interface OffRampState {
  step: OffRampStep;
  amount: string;
  currency: string;
  selectedAnchor: AnchorProvider | null;
  bankAccount: BankAccountInfo | null;
  exchangeRate: ExchangeRate | null;
  session: OffRampSession | null;
  transactionId?: string;
  error: string | null;
  isLoading: boolean;
}

// Anchor provider information
export interface AnchorProvider {
  id: string;
  name: string;
  domain: string;
  logo: string;
  supportedCurrencies: string[];
  supportedRegions: string[];
  fees: {
    deposit: string;
    withdrawal: string;
  };
  processingTime: {
    deposit: string;
    withdrawal: string;
  };
  description?: string;
  kycRequired?: boolean;
}

// SEP-24 transaction info response
export interface SEP24TransactionInfo {
  id: string;
  kind: 'deposit' | 'withdrawal';
  status: TransactionStatus;
  status_eta?: number;
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  started_at?: string;
  completed_at?: string;
  stellar_transaction_id?: string;
  external_transaction_id?: string;
  message?: string;
  refunds?: {
    amount: string;
    fee: string;
  };
}

// SEP-24 interactive response
export interface SEP24InteractiveResponse {
  type: 'interactive_customer_info_needed';
  url: string;
  id: string;
}

// Transaction filter options
export interface TransactionFilter {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: number;
  endDate?: number;
  anchorId?: string;
}

// Transaction history query result
export interface TransactionHistoryResult {
  transactions: FiatTransaction[];
  total: number;
  hasMore: boolean;
}
