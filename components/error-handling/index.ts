/**
 * Error Handling and Loading State Components
 * Centralized exports for all error handling and loading functionality
 */

// Error Handler
export {
  ErrorHandler,
  ErrorDialog,
  WalletConnectionPrompt,
  InsufficientFundsPrompt,
  useErrorHandler,
  type ErrorHandlerProps,
  type ErrorDialogProps,
  type ErrorType,
} from '../error-handler';

// Loading States
export {
  LoadingSpinner,
  PageLoading,
  CardLoadingSkeleton,
  TransactionLoading,
  WalletOperationLoading,
  DataLoading,
  InlineLoading,
  OverlayLoading,
  AsyncOperation,
  useLoadingState,
  type LoadingSpinnerProps,
  type PageLoadingProps,
  type TransactionLoadingProps,
  type WalletOperationLoadingProps,
  type DataLoadingProps,
  type InlineLoadingProps,
  type OverlayLoadingProps,
  type AsyncOperationProps,
} from '../loading-state';

// Transaction Progress
export {
  TransactionProgress,
  CompactTransactionProgress,
  useTransactionProgress,
  DEFAULT_TRANSACTION_STEPS,
  type TransactionProgressProps,
  type CompactTransactionProgressProps,
  type TransactionStep,
  type TransactionStepStatus,
} from '../transaction-progress';

// Async Operation Wrapper
export {
  AsyncOperationWrapper,
  AsyncButton,
  AsyncForm,
  AsyncDataFetcher,
  useAsyncOperation,
  type AsyncOperationWrapperProps,
  type AsyncButtonProps,
  type AsyncFormProps,
  type AsyncDataFetcherProps,
  type OperationState,
  type UseAsyncOperationOptions,
} from '../async-operation-wrapper';

// Re-export existing error handling utilities
export {
  handleStellarError,
  logError,
  createStellarError,
  isErrorCode,
  isUserRejectedError,
  isInsufficientFundsError,
  isNetworkError,
  parseStellarSDKError,
  getErrorSeverity,
  formatErrorMessage,
  getErrorStatistics,
  setErrorLogger,
  getErrorLogger,
  type UserFriendlyMessage,
  type ErrorLogEntry,
  type ErrorLogger,
} from '@/lib/stellar/errors';

// Re-export existing error boundary
export {
  StellarErrorBoundary,
  AsyncErrorBoundary,
  useErrorHandler as useErrorBoundaryHandler,
} from '../stellar/error-boundary';

// Re-export fiat gateway error handlers
export {
  ErrorHandler as FiatErrorHandler,
  NetworkErrorRecovery,
  InsufficientFundsRecovery,
  TrustlineErrorRecovery,
  AnchorUnavailableFallback,
  ErrorDialog as FiatErrorDialog,
  ErrorBoundaryFallback,
  type ErrorHandlerProps as FiatErrorHandlerProps,
  type NetworkErrorRecoveryProps,
  type InsufficientFundsRecoveryProps,
  type TrustlineErrorRecoveryProps,
  type AnchorUnavailableFallbackProps,
  type ErrorDialogProps as FiatErrorDialogProps,
  type ErrorBoundaryFallbackProps,
} from '../fiat-gateway/error-handler';
