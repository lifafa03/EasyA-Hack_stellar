'use client';

import * as React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useFiatBalance } from '@/hooks/use-fiat-balance';
import { AnchorService, type ExchangeRate, type OffRampSession, type BankAccountInfo } from '@/lib/stellar/services/anchor';
import { type AnchorProvider } from '@/lib/stellar/services/anchor-registry';
import { ExchangeRateDisplay } from './exchange-rate-display';
import { InteractivePopup } from './interactive-popup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Info,
  Loader2,
  Shield,
  Wallet,
  Building2,
  ArrowDownToLine
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { TransactionStatus } from '@/lib/stellar/types/fiat-gateway';
import type { Transaction } from '@stellar/stellar-sdk';

type OffRampStep = 'input' | 'bank-info' | 'interactive' | 'processing' | 'complete';

interface OffRampFlowProps {
  selectedAnchor: AnchorProvider;
  onComplete?: (transactionId: string) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
}

export function OffRampFlow({
  selectedAnchor,
  onComplete,
  onError,
  onBack,
}: OffRampFlowProps) {
  const wallet = useWallet();
  const fiatBalance = useFiatBalance();
  
  // State management
  const [step, setStep] = React.useState<OffRampStep>('input');
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState('USD');
  const [bankAccount, setBankAccount] = React.useState<BankAccountInfo>({
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    bankName: '',
  });
  const [exchangeRate, setExchangeRate] = React.useState<ExchangeRate | null>(null);
  const [session, setSession] = React.useState<OffRampSession | null>(null);
  const [transactionId, setTransactionId] = React.useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = React.useState<TransactionStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [availableBalance, setAvailableBalance] = React.useState<string>('0');
  
  const anchorServiceRef = React.useRef<AnchorService | null>(null);

  // Initialize anchor service
  React.useEffect(() => {
    anchorServiceRef.current = new AnchorService(selectedAnchor.domain);
  }, [selectedAnchor.domain]);

  // Get available USDC balance
  React.useEffect(() => {
    if (wallet.connected && wallet.usdcBalance) {
      setAvailableBalance(wallet.usdcBalance);
    }
  }, [wallet.connected, wallet.usdcBalance]);

  // Fetch exchange rate when amount or currency changes
  React.useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setExchangeRate(null);
      return;
    }

    const fetchRate = async () => {
      if (!anchorServiceRef.current) return;

      try {
        const rate = await anchorServiceRef.current.getExchangeRate('USDC', currency);
        setExchangeRate(rate);
      } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
        setExchangeRate(null);
      }
    };

    // Debounce rate fetching
    const timeoutId = setTimeout(fetchRate, 500);
    return () => clearTimeout(timeoutId);
  }, [amount, currency]);

  // Validate amount against available balance
  const validateAmount = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(availableBalance);

    if (amountNum > balanceNum) {
      setError(`Insufficient balance. Available: ${availableBalance} USDC`);
      return false;
    }

    return true;
  };

  // Handle proceeding to bank info step
  const handleProceedToBankInfo = () => {
    if (!validateAmount()) {
      return;
    }

    setError(null);
    setStep('bank-info');
  };

  // Validate bank account information
  const validateBankAccount = (): boolean => {
    if (!bankAccount.accountNumber || bankAccount.accountNumber.trim() === '') {
      setError('Account number is required');
      return false;
    }

    if (!bankAccount.routingNumber || bankAccount.routingNumber.trim() === '') {
      setError('Routing number is required');
      return false;
    }

    // Basic routing number validation (9 digits)
    if (!/^\d{9}$/.test(bankAccount.routingNumber)) {
      setError('Routing number must be 9 digits');
      return false;
    }

    return true;
  };

  // Handle starting the off-ramp process
  const handleStartOffRamp = async () => {
    if (!wallet.publicKey || !anchorServiceRef.current) {
      setError('Wallet not connected');
      return;
    }

    if (!validateBankAccount()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create signer function
      const signer = async (tx: Transaction) => {
        // In production, this would use the actual wallet to sign
        throw new Error('Wallet signing not implemented - please connect your wallet');
      };

      const offRampSession = await anchorServiceRef.current.offRamp(
        {
          amount,
          currency,
          sourceAddress: wallet.publicKey,
          bankAccount,
        },
        signer
      );

      setSession(offRampSession);
      setTransactionId(offRampSession.id);
      
      // Track the transaction
      fiatBalance.trackTransaction({
        id: offRampSession.id,
        type: 'off-ramp',
        status: 'pending_user_transfer_start',
        amount,
        currency,
        cryptoAmount: amount,
        cryptoCurrency: 'USDC',
        exchangeRate: exchangeRate?.rate || '0',
        fees: exchangeRate?.fee || '0',
        anchorId: selectedAnchor.id,
        anchorName: selectedAnchor.name,
        createdAt: Date.now(),
      });
      
      setStep('interactive');
      toast.success('Off-ramp session started');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start off-ramp';
      setError(errorMessage);
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle interactive popup completion
  const handleInteractiveComplete = async (result: any) => {
    setStep('processing');
    setTransactionStatus(result.status);

    if (result.transactionId) {
      setTransactionId(result.transactionId);
    }

    // Start polling for transaction status
    if (transactionId && anchorServiceRef.current) {
      try {
        // Get auth token for polling
        const signer = async (tx: Transaction) => {
          throw new Error('Wallet signing not implemented');
        };
        
        const authToken = await anchorServiceRef.current.getAuthToken(
          wallet.publicKey!,
          signer
        );

        // Poll transaction status
        const finalStatus = await anchorServiceRef.current.pollTransactionStatus(
          transactionId,
          authToken,
          {
            onStatusChange: (status) => {
              setTransactionStatus(status);
              fiatBalance.updateTransactionStatus(transactionId, status);
              toast.info(`Transaction status: ${status}`);
            },
          }
        );

        if (finalStatus === 'completed') {
          setStep('complete');
          fiatBalance.updateTransactionStatus(transactionId, 'completed');
          toast.success('Withdrawal completed successfully!');
          
          // Refresh wallet balance
          await fiatBalance.refreshBalance();
          
          if (onComplete && transactionId) {
            onComplete(transactionId);
          }
        } else if (finalStatus === 'error') {
          setError('Transaction failed');
          fiatBalance.updateTransactionStatus(transactionId, 'error');
          toast.error('Transaction failed');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to monitor transaction';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  // Handle interactive popup error
  const handleInteractiveError = (errorMessage: string) => {
    setError(errorMessage);
    setStep('input');
    if (onError) onError(errorMessage);
  };

  // Calculate receive amount
  const calculateReceiveAmount = () => {
    if (!amount || !exchangeRate) return '0.00';
    
    const amountNum = parseFloat(amount);
    const rateNum = parseFloat(exchangeRate.rate);
    const feeNum = parseFloat(exchangeRate.fee);
    
    const receiveAmount = amountNum * rateNum - (amountNum * feeNum);
    return receiveAmount.toFixed(2);
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'input', label: 'Amount' },
      { key: 'bank-info', label: 'Bank Info' },
      { key: 'interactive', label: 'Confirm' },
      { key: 'processing', label: 'Processing' },
      { key: 'complete', label: 'Complete' },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <nav aria-label="Withdrawal progress" className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  index <= currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
                aria-current={index === currentIndex ? 'step' : undefined}
                aria-label={`Step ${index + 1}: ${s.label}${index < currentIndex ? ' - Completed' : index === currentIndex ? ' - Current' : ' - Upcoming'}`}
                role="img"
              >
                {index < currentIndex ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs mt-2 text-muted-foreground" aria-hidden="true">{s.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 transition-colors',
                  index < currentIndex ? 'bg-primary' : 'bg-muted'
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  };

  // Render input step
  const renderInputStep = () => (
    <div className="space-y-6">
      {/* Anchor Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Selected Anchor</CardTitle>
              <CardDescription>{selectedAnchor.name}</CardDescription>
            </div>
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                Change
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Withdrawal Fee:</span>
            <span className="font-medium">{selectedAnchor.fees.withdrawal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Processing Time:</span>
            <span className="font-medium">{selectedAnchor.processingTime.withdrawal}</span>
          </div>
        </CardContent>
      </Card>

      {/* Available Balance */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Available Balance</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{availableBalance} USDC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdrawal Amount</CardTitle>
          <CardDescription>Enter the amount you want to withdraw</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                min="0"
                step="0.01"
                max={availableBalance}
                aria-label="Withdrawal amount in USDC"
                aria-describedby="amount-limits-withdraw"
                aria-invalid={amount && (parseFloat(amount) < 10 || parseFloat(amount) > parseFloat(availableBalance))}
              />
            </div>
            <div id="amount-limits-withdraw" className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum: $10.00</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setAmount(availableBalance)}
                aria-label={`Use maximum available balance of ${availableBalance} USDC`}
              >
                Use Max
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Receive Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" aria-label="Select currency to receive">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedAnchor.supportedCurrencies.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rate Display */}
      {exchangeRate && (
        <ExchangeRateDisplay
          rate={exchangeRate}
          onRefresh={async () => {
            if (anchorServiceRef.current) {
              const rate = await anchorServiceRef.current.getExchangeRate('USDC', currency);
              setExchangeRate(rate);
            }
          }}
        />
      )}

      {/* Summary */}
      {amount && exchangeRate && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You send:</span>
                <span className="font-medium">{amount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-medium text-lg">{calculateReceiveAmount()} {currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Button */}
      <Button
        onClick={handleProceedToBankInfo}
        disabled={
          !amount ||
          parseFloat(amount) <= 0 ||
          !exchangeRate ||
          !wallet.connected ||
          parseFloat(amount) > parseFloat(availableBalance)
        }
        className="w-full"
        size="lg"
        aria-label="Continue to bank information step"
      >
        Continue to Bank Information
        <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
      </Button>
    </div>
  );

  // Render bank info step
  const renderBankInfoStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Bank Account Information</CardTitle>
              <CardDescription>Enter your bank details to receive funds</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert role="status">
            <Shield className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Secure Information</AlertTitle>
            <AlertDescription className="text-xs">
              Your bank information is transmitted securely and is not stored by our platform.
              It is only shared with the anchor service to process your withdrawal.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="bank-name">Bank Name (Optional)</Label>
            <Input
              id="bank-name"
              type="text"
              placeholder="e.g., Chase Bank"
              value={bankAccount.bankName || ''}
              onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
              aria-label="Bank name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-type">Account Type</Label>
            <Select
              value={bankAccount.accountType}
              onValueChange={(v) => setBankAccount({ ...bankAccount, accountType: v as 'checking' | 'savings' })}
            >
              <SelectTrigger id="account-type" aria-label="Select account type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routing-number">Routing Number</Label>
            <Input
              id="routing-number"
              type="text"
              placeholder="9 digits"
              value={bankAccount.routingNumber || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                setBankAccount({ ...bankAccount, routingNumber: value });
              }}
              maxLength={9}
              aria-label="Bank routing number"
              aria-describedby="routing-help"
              aria-invalid={bankAccount.routingNumber && bankAccount.routingNumber.length !== 9}
              inputMode="numeric"
            />
            <p id="routing-help" className="text-xs text-muted-foreground">
              The 9-digit number at the bottom left of your check
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-number">Account Number</Label>
            <Input
              id="account-number"
              type="text"
              placeholder="Your account number"
              value={bankAccount.accountNumber || ''}
              onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
              aria-label="Bank account number"
              aria-describedby="account-help"
              aria-invalid={!bankAccount.accountNumber}
            />
            <p id="account-help" className="text-xs text-muted-foreground">
              The account number at the bottom of your check
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setStep('input');
          }}
          className="flex-1"
          aria-label="Go back to amount input"
        >
          Back
        </Button>
        <Button
          onClick={handleStartOffRamp}
          disabled={isLoading}
          className="flex-1"
          size="lg"
          aria-label="Continue to confirmation step"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Starting...
            </>
          ) : (
            <>
              Continue to Confirmation
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Spinner className="h-12 w-12" />
            <div>
              <h3 className="font-semibold text-lg">Processing Your Withdrawal</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we process your transaction
              </p>
            </div>
            {transactionStatus && (
              <Badge variant="secondary" className="mt-2">
                Status: {transactionStatus.replace(/_/g, ' ')}
              </Badge>
            )}
            <Progress value={66} className="w-full" />
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What's happening?</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm mt-2">
            <li>Verifying your bank account</li>
            <li>Processing through the anchor</li>
            <li>Initiating bank transfer</li>
          </ul>
          <p className="text-xs mt-3 text-muted-foreground">
            Bank transfers typically take 1-3 business days to complete
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );

  // Render complete step
  const renderCompleteStep = () => (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Withdrawal initiated successfully">
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center" role="img" aria-label="Success">
              <CheckCircle2 className="h-8 w-8 text-green-500" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Withdrawal Initiated!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your withdrawal has been successfully initiated
              </p>
            </div>
            {transactionId && (
              <div className="w-full p-3 rounded-lg bg-muted text-xs font-mono break-all" aria-label={`Transaction ID: ${transactionId}`}>
                Transaction ID: {transactionId}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert role="status">
        <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Next Steps</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm mt-2">
            <li>Funds will be transferred to your bank account</li>
            <li>Processing typically takes 1-3 business days</li>
            <li>You'll receive a confirmation email when complete</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount Withdrawn</p>
              <p className="text-2xl font-bold mt-1" aria-label={`Amount withdrawn: ${amount} USDC`}>{amount} USDC</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">You'll Receive</p>
              <p className="text-2xl font-bold mt-1" aria-label={`You will receive: ${calculateReceiveAmount()} ${currency}`}>{calculateReceiveAmount()} {currency}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => {
          // Reset flow
          setStep('input');
          setAmount('');
          setBankAccount({
            accountNumber: '',
            routingNumber: '',
            accountType: 'checking',
            bankName: '',
          });
          setSession(null);
          setTransactionId(null);
          setTransactionStatus(null);
          setError(null);
        }}
        className="w-full"
        size="lg"
        aria-label="Start a new withdrawal"
      >
        Make Another Withdrawal
      </Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto" role="main" aria-label="Withdrawal flow">
      {renderStepIndicator()}

      {step === 'input' && renderInputStep()}
      {step === 'bank-info' && renderBankInfoStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'complete' && renderCompleteStep()}

      {/* Interactive Popup */}
      {step === 'interactive' && session && (
        <InteractivePopup
          url={session.url}
          open={true}
          onClose={() => setStep('bank-info')}
          onComplete={handleInteractiveComplete}
          onError={handleInteractiveError}
          anchorDomain={selectedAnchor.domain}
          title="Complete Your Withdrawal"
          description="Follow the instructions to confirm your withdrawal"
        />
      )}
    </div>
  );
}
