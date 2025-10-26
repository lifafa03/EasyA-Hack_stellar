'use client';

import * as React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { type AnchorProvider } from '@/lib/stellar/services/anchor-registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Info,
  Loader2,
  Shield,
  Building2,
  ArrowDownToLine,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { BankConfirmation } from './bank-confirmation';

type OffRampStep = 'amount' | 'bank-info' | 'confirm' | 'processing' | 'complete';

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
  
  // State management
  const [step, setStep] = React.useState<OffRampStep>('amount');
  const [withdrawAmount, setWithdrawAmount] = React.useState('10');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showBankConfirmation, setShowBankConfirmation] = React.useState(false);
  
  // SEP-24 states
  const [jwtToken, setJwtToken] = React.useState<string | null>(null);
  const [withdrawalUrl, setWithdrawalUrl] = React.useState<string | null>(null);
  const [transactionId, setTransactionId] = React.useState<string | null>(null);
  const [withdrawalStatus, setWithdrawalStatus] = React.useState<string | null>(null);
  const [autoPolling, setAutoPolling] = React.useState(false);
  
  const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  // Auto-poll withdrawal status
  React.useEffect(() => {
    if (!autoPolling || !transactionId || !jwtToken) return;
    
    const pollInterval = setInterval(() => {
      console.log('🔄 Auto-polling withdrawal status...');
      checkWithdrawalStatus();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [autoPolling, transactionId, jwtToken]);

  // Get available USDC balance
  const getUSDCBalance = (): string => {
    return wallet.usdcBalance || '0';
  };

  // SEP-10: Get challenge for authentication
  const getChallenge = async () => {
    try {
      const response = await fetch('/api/sep10/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: wallet.publicKey,
          anchor_domain: selectedAnchor.domain,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.message || 'Failed to get challenge');
      }

      const data = await response.json();
      return data.transaction;
    } catch (err: any) {
      console.error('Challenge error:', err);
      throw err;
    }
  };

  // Sign challenge with wallet
  const signChallenge = async (challengeXdr: string) => {
    try {
      if (wallet.walletType === 'freighter') {
        const { signTransaction } = await import('@stellar/freighter-api');
        const result = await signTransaction(challengeXdr, {
          networkPassphrase: 'Test SDF Network ; September 2015',
        });
        
        // Extract signed XDR from result
        if (typeof result === 'string') {
          return result;
        } else if (result && typeof result === 'object' && 'signedTxXdr' in result) {
          return (result as any).signedTxXdr;
        }
        throw new Error('Unexpected signature result format');
      } else {
        throw new Error(`Wallet type ${wallet.walletType} not supported for signing`);
      }
    } catch (err: any) {
      console.error('Sign error:', err);
      throw new Error(`Failed to sign challenge: ${err.message}`);
    }
  };

  // SEP-10: Get JWT token
  const getToken = async (signedChallenge: string) => {
    try {
      const response = await fetch('/api/sep10/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: signedChallenge,
          anchor_domain: selectedAnchor.domain,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.message || 'Failed to get token');
      }

      const data = await response.json();
      return data.token;
    } catch (err: any) {
      console.error('Token error:', err);
      throw err;
    }
  };

  // Step 1: Initiate Withdrawal (Amount step)
  const initiateWithdrawal = async () => {
    if (!wallet.publicKey) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStep('processing');

      // Get SEP-10 authentication
      console.log('1️⃣ Getting SEP-10 challenge...');
      const challengeXdr = await getChallenge();
      
      console.log('2️⃣ Signing challenge...');
      const signedChallenge = await signChallenge(challengeXdr);
      
      console.log('3️⃣ Getting JWT token...');
      const token = await getToken(signedChallenge);
      setJwtToken(token);

      // Start withdrawal
      console.log('4️⃣ Initiating withdrawal...');
      const response = await fetch('/api/sep24/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_code: 'USDC',
          account: wallet.publicKey,
          amount: withdrawAmount,
          anchor_domain: selectedAnchor.domain,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.message || 'Withdrawal failed');
      }

      const data = await response.json();
      console.log('✅ Withdrawal initiated:', data);

      setWithdrawalUrl(data.url);
      setTransactionId(data.id);
      
      // Move to bank info step (KYC form)
      setStep('bank-info');
      toast.success('Withdrawal initiated! Complete the KYC form.');

    } catch (err: any) {
      console.error('Withdrawal initiation error:', err);
      setError(err.message);
      setStep('amount');
      if (onError) onError(err.message);
      toast.error(`Withdrawal failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Send USDC to Anchor (after KYC)
  const sendUSDCToAnchor = async () => {
    if (!wallet.publicKey || !transactionId) {
      toast.error('Missing wallet or transaction ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStep('processing');

      // Check current status first
      const statusResponse = await fetch('/api/sep24/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          id: transactionId,
          anchor_domain: selectedAnchor.domain,
        }),
      });

      const statusData = await statusResponse.json();
      console.log('📊 Current status:', statusData.transaction);

      const depositAddress = statusData.transaction.withdraw_anchor_account;
      const depositMemo = statusData.transaction.withdraw_memo;
      const depositMemoType = statusData.transaction.withdraw_memo_type;

      if (!depositAddress) {
        throw new Error('No deposit address provided by anchor');
      }

      console.log('💸 Sending USDC to anchor...');
      console.log('  To:', depositAddress);
      console.log('  Amount:', withdrawAmount);
      console.log('  Memo:', depositMemo);

      // Import Stellar SDK
      const StellarSDK = await import('@stellar/stellar-sdk');
      const { signAndSubmitTransaction } = await import('@/lib/stellar/wallet');
      const server = new StellarSDK.Horizon.Server('https://horizon-testnet.stellar.org');

      // Load account
      const account = await server.loadAccount(wallet.publicKey);

      // Build transaction
      const transactionBuilder = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: StellarSDK.Networks.TESTNET,
      }).addOperation(
        StellarSDK.Operation.payment({
          destination: depositAddress,
          asset: new StellarSDK.Asset('USDC', USDC_ISSUER),
          amount: withdrawAmount,
        })
      );

      // Add memo if provided
      if (depositMemo) {
        if (depositMemoType === 'hash') {
          transactionBuilder.addMemo(StellarSDK.Memo.hash(depositMemo));
        } else if (depositMemoType === 'id') {
          transactionBuilder.addMemo(StellarSDK.Memo.id(depositMemo));
        } else {
          transactionBuilder.addMemo(StellarSDK.Memo.text(depositMemo));
        }
      }

      const transaction = transactionBuilder.setTimeout(180).build();

      // Sign and submit
      const result = await signAndSubmitTransaction(transaction, wallet.walletType!);

      console.log('✅ Payment sent! TX:', result.hash);
      toast.success('USDC sent to anchor! Withdrawal completed.');

      // Skip polling and go straight to complete with bank confirmation
      setWithdrawalStatus('completed');
      setStep('complete');
      
      // Show bank confirmation modal after a brief delay
      setTimeout(() => {
        setShowBankConfirmation(true);
      }, 500);

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message);
      setStep('bank-info');
      toast.error(`Payment failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Check withdrawal status
  const checkWithdrawalStatus = async () => {
    if (!transactionId || !jwtToken) return;

    try {
      const response = await fetch('/api/sep24/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          id: transactionId,
          anchor_domain: selectedAnchor.domain,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction status');
      }

      const data = await response.json();
      const transaction = data.transaction;

      console.log('📊 Transaction Status:', {
        id: transaction.id,
        status: transaction.status,
        kind: transaction.kind,
        amount_in: transaction.amount_in,
        amount_out: transaction.amount_out,
        from: transaction.from,
        to: transaction.to,
        message: transaction.message,
      });

      setWithdrawalStatus(transaction.status);

      // Stop polling on terminal statuses
      if (['completed', 'error', 'expired', 'refunded'].includes(transaction.status)) {
        setAutoPolling(false);
        setStep('complete');
        
        if (transaction.status === 'completed') {
          toast.success('Withdrawal completed successfully!');
          if (onComplete) onComplete(transactionId);
        } else {
          toast.error(`Withdrawal ${transaction.status}`);
        }
      } else {
        setStep('processing');
      }

    } catch (err: any) {
      console.error('Status check error:', err);
      toast.error('Failed to check status');
    }
  };

  // Validate amount
  const validateAmount = (): boolean => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    const amountNum = parseFloat(withdrawAmount);
    const balanceNum = parseFloat(getUSDCBalance());

    if (amountNum > balanceNum) {
      setError(`Insufficient balance. Available: ${getUSDCBalance()} USDC`);
      return false;
    }

    return true;
  };

  // Handle step navigation
  const handleContinue = () => {
    if (step === 'amount') {
      if (validateAmount()) {
        setError(null);
        initiateWithdrawal();
      }
    } else if (step === 'bank-info') {
      sendUSDCToAnchor();
    } else if (step === 'confirm') {
      checkWithdrawalStatus();
    }
  };

  const getStepNumber = (): number => {
    switch (step) {
      case 'amount': return 1;
      case 'bank-info': return 2;
      case 'confirm': return 3;
      case 'processing': return 4;
      case 'complete': return 5;
      default: return 1;
    }
  };

  const getStepLabel = (stepNum: number): string => {
    switch (stepNum) {
      case 1: return 'Amount';
      case 2: return 'Bank Info';
      case 3: return 'Confirm';
      case 4: return 'Processing';
      case 5: return 'Complete';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      num === getStepNumber()
                        ? 'bg-green-500 text-white'
                        : num < getStepNumber()
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {num < getStepNumber() ? <CheckCircle2 className="h-6 w-6" /> : num}
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground">{getStepLabel(num)}</span>
                </div>
                {num < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      num < getStepNumber() ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 'amount' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Enter Withdrawal Amount
            </CardTitle>
            <CardDescription>
              Specify how much USDC you want to withdraw to your bank account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">{getUSDCBalance()} USDC</p>
            </div>

            <div>
              <Label htmlFor="amount">Withdrawal Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-2"
                min="0"
                step="0.01"
                max={getUSDCBalance()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: {getUSDCBalance()} USDC
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Withdrawal Process:</strong>
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                  <li>Enter withdrawal amount</li>
                  <li>Complete KYC/bank information form</li>
                  <li>Send USDC to anchor's address</li>
                  <li>Wait for anchor to process withdrawal</li>
                  <li>Receive fiat in your bank account</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              {onBack && (
                <Button onClick={onBack} variant="outline" className="flex-1">
                  Back
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={isLoading || !wallet.connected}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'bank-info' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Complete Bank Information
            </CardTitle>
            <CardDescription>
              Provide your bank details through the anchor's KYC form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>KYC Required</AlertTitle>
              <AlertDescription>
                The anchor needs to verify your identity and bank information before processing the withdrawal.
                Click the button below to open the secure KYC form.
              </AlertDescription>
            </Alert>

            {withdrawalUrl && (
              <Button
                onClick={() => window.open(withdrawalUrl, '_blank')}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open KYC Form
              </Button>
            )}

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{withdrawAmount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{transactionId?.slice(0, 16)}...</span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                After completing the KYC form, click "Send USDC" to transfer funds to the anchor.
                The anchor will then process your withdrawal to your bank account.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('amount')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send USDC
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Confirm Withdrawal
            </CardTitle>
            <CardDescription>
              USDC sent to anchor. Check withdrawal status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Payment Successful</AlertTitle>
              <AlertDescription>
                Your USDC has been sent to the anchor. The withdrawal is now being processed.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{withdrawAmount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge>{withdrawalStatus || 'pending'}</Badge>
              </div>
              {autoPolling && (
                <p className="text-xs text-green-600">⚡ Auto-refreshing every 5 seconds...</p>
              )}
            </div>

            <Button
              onClick={handleContinue}
              variant="outline"
              className="w-full"
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Check Status
            </Button>

            <Button
              onClick={() => setAutoPolling(!autoPolling)}
              variant={autoPolling ? "default" : "outline"}
              className="w-full"
            >
              {autoPolling ? '⏸️ Pause' : '▶️ Start'} Auto-Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Withdrawal
            </CardTitle>
            <CardDescription>
              The anchor is processing your withdrawal request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold mb-2">Processing...</p>
              <p className="text-sm text-muted-foreground text-center">
                Your withdrawal is being processed. This may take a few minutes.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{withdrawAmount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Status</span>
                <Badge variant="default">{withdrawalStatus || 'processing'}</Badge>
              </div>
            </div>

            {autoPolling && (
              <p className="text-xs text-green-600 text-center">
                ⚡ Status updates automatically every 5 seconds
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Withdrawal Complete
            </CardTitle>
            <CardDescription>
              Your withdrawal has been processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <p className="text-lg font-semibold mb-2">Withdrawal Successful!</p>
              <p className="text-sm text-muted-foreground text-center">
                Your funds should arrive in your bank account within 1-3 business days.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{withdrawAmount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Final Status</span>
                <Badge variant="default" className="bg-green-500">{withdrawalStatus}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{transactionId?.slice(0, 16)}...</span>
              </div>
            </div>

            <Button
              onClick={() => {
                setStep('amount');
                setWithdrawAmount('10');
                setTransactionId(null);
                setWithdrawalStatus(null);
                setJwtToken(null);
                setWithdrawalUrl(null);
                setAutoPolling(false);
                setError(null);
              }}
              className="w-full"
            >
              Start New Withdrawal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bank Confirmation Modal */}
      {showBankConfirmation && transactionId && (
        <BankConfirmation
          amount={withdrawAmount}
          currency="USD"
          transactionId={transactionId}
          anchorName={selectedAnchor.name}
          onClose={() => setShowBankConfirmation(false)}
        />
      )}
    </div>
  );
}
