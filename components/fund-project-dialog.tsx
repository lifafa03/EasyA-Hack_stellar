/**
 * Fund Project Dialog Component
 * Modal for funding projects with USDC balance validation
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Loader2,
  TrendingUp,
  Info
} from 'lucide-react';
import { preTransactionValidation, formatUSDC } from '@/lib/stellar/balance-validation';
import { BalanceValidationAlert, BalanceDisplay, TransactionWarnings } from '@/components/balance-validation-alert';

type FundingState = 
  | 'idle'
  | 'validating'
  | 'confirming'
  | 'processing'
  | 'success'
  | 'error';

interface FundProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  projectBudget: number;
  currentFunding: number;
  onFund: (amount: string) => Promise<void>;
  isWalletConnected: boolean;
  walletPublicKey?: string | null;
  usdcBalance?: string | null;
}

export function FundProjectDialog({
  open,
  onOpenChange,
  projectTitle,
  projectBudget,
  currentFunding,
  onFund,
  isWalletConnected,
  walletPublicKey,
  usdcBalance,
}: FundProjectDialogProps) {
  const [amount, setAmount] = React.useState('');
  const [fundingState, setFundingState] = React.useState<FundingState>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [balanceValidation, setBalanceValidation] = React.useState<any>(null);
  const [showBalanceCheck, setShowBalanceCheck] = React.useState(false);

  const remainingBudget = projectBudget - currentFunding;
  const isProcessing = fundingState !== 'idle' && fundingState !== 'success' && fundingState !== 'error';

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    switch (fundingState) {
      case 'idle': return 0;
      case 'validating': return 25;
      case 'confirming': return 50;
      case 'processing': return 75;
      case 'success': return 100;
      case 'error': return 0;
      default: return 0;
    }
  };

  const getStatusMessage = (): string => {
    switch (fundingState) {
      case 'validating': return 'Validating balance...';
      case 'confirming': return 'Confirming transaction...';
      case 'processing': return 'Processing payment...';
      case 'success': return 'Funding successful!';
      case 'error': return 'Funding failed';
      default: return '';
    }
  };

  // Check balance when amount changes
  React.useEffect(() => {
    const checkBalance = async () => {
      if (amount && walletPublicKey && isWalletConnected) {
        const fundAmount = parseFloat(amount);
        if (!isNaN(fundAmount) && fundAmount > 0) {
          try {
            const validation = await preTransactionValidation(
              walletPublicKey,
              amount,
              'funding'
            );
            setBalanceValidation(validation);
            setShowBalanceCheck(true);
          } catch (error) {
            console.error('Balance check error:', error);
          }
        }
      }
    };

    const debounce = setTimeout(checkBalance, 500);
    return () => clearTimeout(debounce);
  }, [amount, walletPublicKey, isWalletConnected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWalletConnected) {
      setErrorMessage('Please connect your wallet first');
      setFundingState('error');
      return;
    }

    if (!walletPublicKey) {
      setErrorMessage('Wallet public key not available');
      setFundingState('error');
      return;
    }

    try {
      setErrorMessage(null);
      setFundingState('validating');

      // Validate amount
      const fundAmount = parseFloat(amount);
      if (isNaN(fundAmount) || fundAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (fundAmount > remainingBudget) {
        throw new Error(`Amount cannot exceed remaining budget of ${formatUSDC(remainingBudget)}`);
      }

      // Validate USDC balance
      const validation = await preTransactionValidation(
        walletPublicKey,
        amount,
        'funding'
      );

      if (!validation.canProceed) {
        setBalanceValidation(validation);
        setShowBalanceCheck(true);
        setFundingState('error');
        setErrorMessage('Insufficient USDC balance to fund this project');
        return;
      }

      setFundingState('confirming');

      // Call parent fund handler
      await onFund(amount);

      setFundingState('success');

      // Reset and close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setFundingState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Funding error:', error);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('');
      setFundingState('idle');
      setErrorMessage(null);
      setBalanceValidation(null);
      setShowBalanceCheck(false);
      onOpenChange(false);
    }
  };

  const setQuickAmount = (percentage: number) => {
    const quickAmount = (remainingBudget * percentage / 100).toFixed(2);
    setAmount(quickAmount);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Fund Project</DialogTitle>
          <DialogDescription>
            Support {projectTitle} by contributing USDC
          </DialogDescription>
        </DialogHeader>

        {!isWalletConnected ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to fund this project.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Progress Indicator */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{getStatusMessage()}</span>
                  <span className="font-semibold">{getProgressPercentage()}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
            )}

            {/* Balance Validation */}
            {showBalanceCheck && balanceValidation && !balanceValidation.canProceed && (
              <BalanceValidationAlert 
                validationResult={balanceValidation.validationResult}
                showDetails={true}
              />
            )}

            {/* Transaction Warnings */}
            {balanceValidation?.warnings && balanceValidation.canProceed && (
              <TransactionWarnings warnings={balanceValidation.warnings} />
            )}

            {/* Error Alert */}
            {fundingState === 'error' && errorMessage && !balanceValidation && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {fundingState === 'success' && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  Project funded successfully! Your contribution has been recorded.
                </AlertDescription>
              </Alert>
            )}

            {/* Project Info */}
            <div className="p-3 bg-surface-dark rounded-lg border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project Budget:</span>
                <span className="font-semibold">{formatUSDC(projectBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Funding:</span>
                <span className="font-semibold">{formatUSDC(currentFunding)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-semibold text-[#4ade80]">{formatUSDC(remainingBudget)}</span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <Label htmlFor="fund-amount">Funding Amount (USDC) *</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input 
                  id="fund-amount" 
                  type="number" 
                  step="0.01"
                  placeholder="100.00" 
                  required 
                  className="pl-9"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isProcessing}
                  max={remainingBudget}
                />
              </div>
              <p className="text-xs text-muted mt-1">
                Maximum: {formatUSDC(remainingBudget)}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickAmount(25)}
                disabled={isProcessing}
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickAmount(50)}
                disabled={isProcessing}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickAmount(75)}
                disabled={isProcessing}
              >
                75%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickAmount(100)}
                disabled={isProcessing}
              >
                100%
              </Button>
            </div>

            {/* Balance Display */}
            {amount && usdcBalance && isWalletConnected && (
              <BalanceDisplay 
                available={usdcBalance}
                required={amount}
              />
            )}

            {/* Info Box */}
            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <h4 className="font-semibold mb-1 text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Escrow Protection
              </h4>
              <p className="text-sm text-muted">
                Your funds will be held in a secure escrow contract and released to the freelancer 
                only when milestones are completed and approved.
              </p>
            </div>

            {/* Action Buttons */}
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
                disabled={isProcessing || !amount}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {fundingState === 'validating' && 'Validating...'}
                    {fundingState === 'confirming' && 'Confirming...'}
                    {fundingState === 'processing' && 'Processing...'}
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fund Project
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
