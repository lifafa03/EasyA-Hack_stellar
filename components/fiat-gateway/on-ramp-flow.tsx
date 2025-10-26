'use client';

import * as React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useFiatBalance } from '@/hooks/use-fiat-balance';
import { AnchorService, type ExchangeRate, type OnRampSession } from '@/lib/stellar/services/anchor';
import { AnchorRegistry, type AnchorProvider } from '@/lib/stellar/services/anchor-registry';
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
  CreditCard, 
  DollarSign, 
  Info,
  Loader2,
  Shield,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { TransactionStatus } from '@/lib/stellar/types/fiat-gateway';
import type { Transaction } from '@stellar/stellar-sdk';

type OnRampStep = 'input' | 'interactive' | 'processing' | 'complete';
type PaymentMethod = 'bank_transfer' | 'credit_card' | 'debit_card' | 'wire_transfer';

interface OnRampFlowProps {
  selectedAnchor: AnchorProvider;
  onComplete?: (transactionId: string) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
}

export function OnRampFlow({
  selectedAnchor,
  onComplete,
  onError,
  onBack,
}: OnRampFlowProps) {
  const wallet = useWallet();
  const fiatBalance = useFiatBalance();
  
  // State management
  const [step, setStep] = React.useState<OnRampStep>('input');
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState('USD');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('bank_transfer');
  const [exchangeRate, setExchangeRate] = React.useState<ExchangeRate | null>(null);
  const [session, setSession] = React.useState<OnRampSession | null>(null);
  const [transactionId, setTransactionId] = React.useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = React.useState<TransactionStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [trustlineChecked, setTrustlineChecked] = React.useState(false);
  const [trustlineExists, setTrustlineExists] = React.useState(false);
  const [creatingTrustline, setCreatingTrustline] = React.useState(false);
  
  const anchorServiceRef = React.useRef<AnchorService | null>(null);

  // Initialize anchor service
  React.useEffect(() => {
    anchorServiceRef.current = new AnchorService(selectedAnchor.domain);
  }, [selectedAnchor.domain]);

  // Fetch exchange rate when amount or currency changes
  React.useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setExchangeRate(null);
      return;
    }

    const fetchRate = async () => {
      if (!anchorServiceRef.current) return;

      try {
        const rate = await anchorServiceRef.current.getExchangeRate(currency, 'USDC');
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

  // Check trustline when wallet is connected
  React.useEffect(() => {
    const checkTrustline = async () => {
      if (!wallet.publicKey || !anchorServiceRef.current || trustlineChecked) return;

      try {
        // For USDC, we need to check trustline with the issuer
        // This is a simplified check - in production, get the actual issuer from anchor info
        const usdcIssuer = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'; // Circle USDC issuer on testnet
        
        const trustlineInfo = await anchorServiceRef.current.checkTrustline(
          wallet.publicKey,
          'USDC',
          usdcIssuer
        );
        
        setTrustlineExists(trustlineInfo.exists);
        setTrustlineChecked(true);
      } catch (err) {
        console.error('Failed to check trustline:', err);
        // Don't block the flow if trustline check fails
        setTrustlineChecked(true);
      }
    };

    checkTrustline();
  }, [wallet.publicKey, trustlineChecked]);

  // Handle trustline creation
  const handleCreateTrustline = async () => {
    if (!wallet.publicKey || !anchorServiceRef.current) {
      setError('Wallet not connected');
      return;
    }

    setCreatingTrustline(true);
    setError(null);

    try {
      const usdcIssuer = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
      
      // Create signer function
      const signer = async (tx: Transaction) => {
        // In production, this would use the actual wallet to sign
        // For now, we'll throw an error to indicate this needs wallet integration
        throw new Error('Wallet signing not implemented - please connect your wallet');
      };

      const txHash = await anchorServiceRef.current.createTrustline(
        wallet.publicKey,
        'USDC',
        usdcIssuer,
        signer
      );

      toast.success('Trustline created successfully!');
      setTrustlineExists(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create trustline';
      setError(errorMessage);
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setCreatingTrustline(false);
    }
  };

  // Handle starting the on-ramp process
  const handleStartOnRamp = async () => {
    if (!wallet.publicKey || !anchorServiceRef.current) {
      setError('Wallet not connected');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Check if trustline exists before proceeding
    if (!trustlineExists && trustlineChecked) {
      setError('USDC trustline required. Please create a trustline first.');
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

      const onRampSession = await anchorServiceRef.current.onRamp(
        {
          amount,
          currency,
          destinationAddress: wallet.publicKey,
          paymentMethod,
        },
        signer
      );

      setSession(onRampSession);
      setTransactionId(onRampSession.id);
      
      // Track the transaction
      fiatBalance.trackTransaction({
        id: onRampSession.id,
        type: 'on-ramp',
        status: 'pending_user_transfer_start',
        amount,
        currency,
        cryptoAmount: calculateReceiveAmount(),
        cryptoCurrency: 'USDC',
        exchangeRate: exchangeRate?.rate || '0',
        fees: exchangeRate?.fee || '0',
        anchorId: selectedAnchor.id,
        anchorName: selectedAnchor.name,
        createdAt: Date.now(),
      });
      
      setStep('interactive');
      toast.success('On-ramp session started');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start on-ramp';
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
          toast.success('Deposit completed successfully!');
          
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
    return receiveAmount.toFixed(4);
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'input', label: 'Amount' },
      { key: 'interactive', label: 'Payment' },
      { key: 'processing', label: 'Processing' },
      { key: 'complete', label: 'Complete' },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <nav aria-label="Deposit progress" className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  index <= currentIndex
                    ? 'bg-[#4ade80] text-white'
                    : 'bg-white/5 text-gray-400'
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
              <span className="text-xs mt-2 text-gray-400" aria-hidden="true">{s.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 transition-colors',
                  index < currentIndex ? 'bg-[#4ade80]' : 'bg-white/10'
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
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-white" id="anchor-info-title">Selected Anchor</CardTitle>
              <CardDescription className="text-gray-400">{selectedAnchor.name}</CardDescription>
            </div>
            {onBack && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBack}
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                aria-label="Change anchor provider"
              >
                Change
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm" aria-labelledby="anchor-info-title">
          <div className="flex justify-between">
            <span className="text-gray-400">Deposit Fee:</span>
            <span className="font-medium text-white" aria-label={`Deposit fee is ${selectedAnchor.fees.deposit}`}>{selectedAnchor.fees.deposit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Processing Time:</span>
            <span className="font-medium text-white" aria-label={`Processing time is ${selectedAnchor.processingTime.deposit}`}>{selectedAnchor.processingTime.deposit}</span>
          </div>
        </CardContent>
      </Card>

      {/* Trustline Check */}
      {trustlineChecked && !trustlineExists && (
        <Alert role="alert" aria-live="polite">
          <Shield className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Trustline Required</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              You need to create a trustline to receive USDC. This is a one-time setup that allows
              your wallet to hold USDC tokens.
            </p>
            <Button
              onClick={handleCreateTrustline}
              disabled={creatingTrustline}
              size="sm"
              aria-label="Create USDC trustline"
              aria-busy={creatingTrustline}
            >
              {creatingTrustline && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
              Create Trustline
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Amount Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deposit Amount</CardTitle>
          <CardDescription>Enter the amount you want to deposit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" aria-label="Select deposit currency">
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

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
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
                aria-label="Deposit amount"
                aria-describedby="amount-limits"
                aria-invalid={amount && (parseFloat(amount) < 10 || parseFloat(amount) > 10000)}
              />
            </div>
            <p id="amount-limits" className="text-xs text-muted-foreground">
              Minimum: $10.00 • Maximum: $10,000.00
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger id="payment-method" aria-label="Select payment method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
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
              const rate = await anchorServiceRef.current.getExchangeRate(currency, 'USDC');
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
                <span className="font-medium">{amount} {currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-medium text-lg">{calculateReceiveAmount()} USDC</span>
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
        onClick={handleStartOnRamp}
        disabled={
          !amount ||
          parseFloat(amount) <= 0 ||
          !exchangeRate ||
          isLoading ||
          !wallet.connected ||
          (!trustlineExists && trustlineChecked)
        }
        className="w-full"
        size="lg"
        aria-label="Continue to payment step"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Starting...
          </>
        ) : (
          <>
            Continue to Payment
            <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Processing deposit">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Spinner className="h-12 w-12" aria-label="Loading" />
            <div>
              <h3 className="font-semibold text-lg">Processing Your Deposit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we process your transaction
              </p>
            </div>
            {transactionStatus && (
              <Badge variant="secondary" className="mt-2" aria-label={`Transaction status: ${transactionStatus.replace(/_/g, ' ')}`}>
                Status: {transactionStatus.replace(/_/g, ' ')}
              </Badge>
            )}
            <Progress value={66} className="w-full" aria-label="Processing progress: 66 percent" />
          </div>
        </CardContent>
      </Card>

      <Alert role="status">
        <Info className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>What's happening?</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm mt-2">
            <li>Verifying your payment</li>
            <li>Processing through the anchor</li>
            <li>Transferring USDC to your wallet</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );

  // Render complete step
  const renderCompleteStep = () => (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Deposit completed successfully">
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center" role="img" aria-label="Success">
              <CheckCircle2 className="h-8 w-8 text-green-500" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Deposit Completed!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your USDC has been successfully deposited to your wallet
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

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount Deposited</p>
              <p className="text-2xl font-bold mt-1" aria-label={`Amount deposited: ${calculateReceiveAmount()} USDC`}>{calculateReceiveAmount()} USDC</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">New Balance</p>
              <p className="text-2xl font-bold mt-1" aria-label={`New balance: ${wallet.usdcBalance || '0.00'} USDC`}>{wallet.usdcBalance || '0.00'} USDC</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => {
          // Reset flow
          setStep('input');
          setAmount('');
          setSession(null);
          setTransactionId(null);
          setTransactionStatus(null);
          setError(null);
        }}
        className="w-full"
        size="lg"
        aria-label="Start a new deposit"
      >
        Make Another Deposit
      </Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto" role="main" aria-label="Deposit flow">
      {renderStepIndicator()}

      {step === 'input' && renderInputStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'complete' && renderCompleteStep()}

      {/* Interactive Popup */}
      {step === 'interactive' && session && (
        <InteractivePopup
          url={session.url}
          open={true}
          onClose={() => setStep('input')}
          onComplete={handleInteractiveComplete}
          onError={handleInteractiveError}
          anchorDomain={selectedAnchor.domain}
          title="Complete Your Deposit"
          description="Follow the instructions to complete your payment"
        />
      )}
    </div>
  );
}
