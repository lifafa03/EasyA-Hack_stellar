import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  ErrorHandler,
  NetworkErrorRecovery,
  InsufficientFundsRecovery,
  TrustlineErrorRecovery,
  AnchorUnavailableFallback,
  ErrorDialog,
} from '../error-handler';
import { StellarError, ErrorCode } from '@/lib/stellar/types';

describe('ErrorHandler', () => {
  it('displays error message', () => {
    const error = new Error('Test error message');
    render(<ErrorHandler error={error} />);
    
    expect(screen.getByText(/Test error message/i)).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const onRetry = jest.fn();
    const error = new Error('Test error');
    
    render(<ErrorHandler error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByText(/Try Again/i);
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    const error = new Error('Test error');
    
    render(<ErrorHandler error={error} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByText(/Dismiss/i);
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('displays user-friendly message for StellarError', () => {
    const error = new StellarError('Network error', ErrorCode.NETWORK_ERROR);
    render(<ErrorHandler error={error} />);
    
    expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
  });
});

describe('NetworkErrorRecovery', () => {
  it('displays network error message', () => {
    const onRetry = jest.fn();
    render(<NetworkErrorRecovery onRetry={onRetry} />);
    
    expect(screen.getByText(/Connection Issue/i)).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const onRetry = jest.fn().mockResolvedValue(undefined);
    render(<NetworkErrorRecovery onRetry={onRetry} />);
    
    const retryButton = screen.getByText(/Retry Now/i);
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled();
    });
  });
});

describe('InsufficientFundsRecovery', () => {
  it('displays balance information', () => {
    render(
      <InsufficientFundsRecovery
        requiredAmount="100.00"
        currentBalance="50.00"
        currency="USDC"
      />
    );
    
    expect(screen.getByText(/100.00 USDC/i)).toBeInTheDocument();
    expect(screen.getByText(/50.00 USDC/i)).toBeInTheDocument();
  });

  it('calculates shortfall correctly', () => {
    render(
      <InsufficientFundsRecovery
        requiredAmount="100.00"
        currentBalance="50.00"
        currency="USDC"
      />
    );
    
    expect(screen.getByText(/50.0000 USDC/i)).toBeInTheDocument();
  });

  it('calls onAddFunds when add funds button is clicked', () => {
    const onAddFunds = jest.fn();
    render(
      <InsufficientFundsRecovery
        requiredAmount="100.00"
        currentBalance="50.00"
        currency="USDC"
        onAddFunds={onAddFunds}
      />
    );
    
    const addFundsButton = screen.getByText(/Add Funds/i);
    fireEvent.click(addFundsButton);
    
    expect(onAddFunds).toHaveBeenCalledTimes(1);
  });
});

describe('TrustlineErrorRecovery', () => {
  it('displays trustline information', () => {
    render(
      <TrustlineErrorRecovery
        asset="USDC"
        issuer="GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
        onCreateTrustline={jest.fn()}
      />
    );
    
    expect(screen.getByText(/Trustline Required/i)).toBeInTheDocument();
    expect(screen.getByText(/USDC/i)).toBeInTheDocument();
  });

  it('calls onCreateTrustline when create button is clicked', () => {
    const onCreateTrustline = jest.fn();
    render(
      <TrustlineErrorRecovery
        asset="USDC"
        issuer="GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
        onCreateTrustline={onCreateTrustline}
      />
    );
    
    const createButton = screen.getByText(/Create Trustline/i);
    fireEvent.click(createButton);
    
    expect(onCreateTrustline).toHaveBeenCalledTimes(1);
  });

  it('disables button when creating trustline', () => {
    render(
      <TrustlineErrorRecovery
        asset="USDC"
        issuer="GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
        onCreateTrustline={jest.fn()}
        isCreating={true}
      />
    );
    
    const createButton = screen.getByText(/Creating Trustline.../i);
    expect(createButton).toBeDisabled();
  });
});

describe('AnchorUnavailableFallback', () => {
  it('displays anchor unavailable message', () => {
    render(
      <AnchorUnavailableFallback
        anchorName="MoneyGram Access"
      />
    );
    
    expect(screen.getByText(/Anchor Service Unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/MoneyGram Access/i)).toBeInTheDocument();
  });

  it('displays alternative anchors', () => {
    const alternatives = [
      { id: 'anchorusd', name: 'AnchorUSD' },
      { id: 'vibrant', name: 'Vibrant' },
    ];
    
    render(
      <AnchorUnavailableFallback
        anchorName="MoneyGram Access"
        alternativeAnchors={alternatives}
      />
    );
    
    expect(screen.getByText(/AnchorUSD/i)).toBeInTheDocument();
    expect(screen.getByText(/Vibrant/i)).toBeInTheDocument();
  });

  it('calls onSelectAlternative when alternative is clicked', () => {
    const onSelectAlternative = jest.fn();
    const alternatives = [
      { id: 'anchorusd', name: 'AnchorUSD' },
    ];
    
    render(
      <AnchorUnavailableFallback
        anchorName="MoneyGram Access"
        alternativeAnchors={alternatives}
        onSelectAlternative={onSelectAlternative}
      />
    );
    
    const alternativeButton = screen.getByText(/AnchorUSD/i);
    fireEvent.click(alternativeButton);
    
    expect(onSelectAlternative).toHaveBeenCalledWith('anchorusd');
  });
});

describe('ErrorDialog', () => {
  it('displays error in dialog', () => {
    const error = new Error('Test error');
    render(
      <ErrorDialog
        open={true}
        error={error}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    const error = new Error('Test error');
    
    render(
      <ErrorDialog
        open={true}
        error={error}
        onClose={onClose}
      />
    );
    
    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
