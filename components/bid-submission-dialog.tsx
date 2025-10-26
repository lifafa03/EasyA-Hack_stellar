/**
 * Bid Submission Dialog Component
 * Handles the complete bid submission flow with signature confirmation
 * Shows step-by-step progress through validation, signing, and submission
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  Clock, 
  DollarSign, 
  Loader2,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { BidFormData } from '@/lib/stellar/bid-validation';
import { preTransactionValidation } from '@/lib/stellar/balance-validation';
import { BalanceValidationAlert, BalanceDisplay, TransactionWarnings } from '@/components/balance-validation-alert';

type SubmitState = 
  | 'idle'
  | 'validating'
  | 'signing'
  | 'verifying'
  | 'submitting'
  | 'success'
  | 'error';

interface BidSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectBudget: number;
  onSubmit: (formData: BidFormData) => Promise<void>;
  isWalletConnected: boolean;
  walletPublicKey?: string | null;
  usdcBalance?: string | null;
}

export function BidSubmissionDialog({
  open,
  onOpenChange,
  projectBudget,
  onSubmit,
  isWalletConnected,
  walletPublicKey,
  usdcBalance,
}: BidSubmissionDialogProps) {
  const [formData, setFormData] = React.useState<BidFormData>({
    bidAmount: '',
    deliveryDays: '',
    proposal: '',
    portfolioLink: '',
    milestonesApproach: '',
  });

  const [submitState, setSubmitState] = React.useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [transactionHash, setTransactionHash] = React.useState<string | null>(null);
  const [balanceValidation, setBalanceValidation] = React.useState<any>(null);
  const [showBalanceCheck, setShowBalanceCheck] = React.useState(false);

  const isSubmitting = submitState !== 'idle' && submitState !== 'success' && submitState !== 'error';

  // Calculate progress percentage based on state
  const getProgressPercentage = (): number => {
    switch (submitState) {
      case 'idle': return 0;
      case 'validating': return 20;
      case 'signing': return 40;
      case 'verifying': return 60;
      case 'submitting': return 80;
      case 'success': return 100;
      case 'error': return 0;
      default: return 0;
    }
  };

  // Get status message based on state
  const getStatusMessage = (): string => {
    switch (submitState) {
      case 'validating': return 'Validating bid parameters...';
      case 'signing': return 'Waiting for wallet signature...';
      case 'verifying': return 'Verifying signature...';
      case 'submitting': return 'Submitting bid to blockchain...';
      case 'success': return 'Bid submitted successfully!';
      case 'error': return 'Submission failed';
      default: return '';
    }
  };

  // Check balance when bid amount changes
  React.useEffect(() => {
    const checkBalance = async () => {
      if (formData.bidAmount && walletPublicKey && isWalletConnected) {
        const bidAmount = parseFloat(formData.bidAmount);
        if (!isNaN(bidAmount) && bidAmount > 0) {
          try {
            const validation = await preTransactionValidation(
              walletPublicKey,
              formData.bidAmount,
              'bid'
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
  }, [formData.bidAmount, walletPublicKey, isWalletConnected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWalletConnected) {
      setErrorMessage('Please connect your wallet first');
      setSubmitState('error');
      return;
    }

    if (!walletPublicKey) {
      setErrorMessage('Wallet public key not available');
      setSubmitState('error');
      return;
    }

    try {
      setErrorMessage(null);
      setSubmitState('validating');

      // Basic validation
      const bidAmount = parseFloat(formData.bidAmount);
      if (isNaN(bidAmount) || bidAmount <= 0) {
        throw new Error('Please enter a valid bid amount');
      }

      if (bidAmount > projectBudget) {
        throw new Error(`Bid amount cannot exceed project budget of ${projectBudget.toLocaleString()} USDC`);
      }

      const deliveryDays = parseInt(formData.deliveryDays);
      if (isNaN(deliveryDays) || deliveryDays <= 0) {
        throw new Error('Please enter a valid delivery time');
      }

      if (formData.proposal.trim().length < 50) {
        throw new Error('Proposal must be at least 50 characters long');
      }

      // Validate USDC balance
      const validation = await preTransactionValidation(
        walletPublicKey,
        formData.bidAmount,
        'bid'
      );

      if (!validation.canProceed) {
        setBalanceValidation(validation);
        setShowBalanceCheck(true);
        setSubmitState('error');
        setErrorMessage('Insufficient USDC balance to place this bid');
        return;
      }

      // Move to signing state
      setSubmitState('signing');

      // Call parent submit handler
      await onSubmit(formData);

      // If we get here, submission was successful
      setSubmitState('success');

      // Reset form and close dialog after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setSubmitState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Bid submission error:', error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        bidAmount: '',
        deliveryDays: '',
        proposal: '',
        portfolioLink: '',
        milestonesApproach: '',
      });
      setSubmitState('idle');
      setErrorMessage(null);
      setTransactionHash(null);
      setBalanceValidation(null);
      setShowBalanceCheck(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Your Bid</DialogTitle>
          <DialogDescription>
            Provide details about your proposal. Your bid will be cryptographically signed for verification.
          </DialogDescription>
        </DialogHeader>

        {!isWalletConnected ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to submit a bid. Your bid will be cryptographically signed for verification.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Progress Indicator */}
            {isSubmitting && (
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
            {submitState === 'error' && errorMessage && !balanceValidation && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {submitState === 'success' && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  Bid submitted successfully! Your bid has been cryptographically signed and verified.
                </AlertDescription>
              </Alert>
            )}

            {/* Balance Display */}
            {formData.bidAmount && usdcBalance && isWalletConnected && (
              <BalanceDisplay 
                available={usdcBalance}
                required={formData.bidAmount}
              />
            )}

            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bid-amount">Bid Amount (USDC) *</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input 
                    id="bid-amount" 
                    type="number" 
                    step="0.01"
                    placeholder="4500.00" 
                    required 
                    className="pl-9"
                    value={formData.bidAmount}
                    onChange={(e) => setFormData({...formData, bidAmount: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  Project budget: ${projectBudget.toLocaleString()} USDC
                </p>
              </div>

              <div>
                <Label htmlFor="delivery-time">Delivery Time (days) *</Label>
                <div className="relative mt-2">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input 
                    id="delivery-time" 
                    type="number" 
                    placeholder="30" 
                    required 
                    className="pl-9"
                    value={formData.deliveryDays}
                    onChange={(e) => setFormData({...formData, deliveryDays: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="proposal">Your Proposal *</Label>
              <Textarea
                id="proposal"
                placeholder="Explain your approach, relevant experience, and why you're the best fit for this project... (minimum 50 characters)"
                required
                className="mt-2 min-h-32"
                value={formData.proposal}
                onChange={(e) => setFormData({...formData, proposal: e.target.value})}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted mt-1">
                {formData.proposal.length} / 50 characters minimum
              </p>
            </div>

            <div>
              <Label htmlFor="portfolio">Portfolio Links</Label>
              <div className="relative mt-2">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input 
                  id="portfolio" 
                  type="url" 
                  placeholder="https://yourportfolio.com" 
                  className="pl-9"
                  value={formData.portfolioLink}
                  onChange={(e) => setFormData({...formData, portfolioLink: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="milestones-approach">Milestone Approach</Label>
              <Textarea
                id="milestones-approach"
                placeholder="How will you tackle each milestone? What's your timeline for each phase?"
                className="mt-2 min-h-24"
                value={formData.milestonesApproach}
                onChange={(e) => setFormData({...formData, milestonesApproach: e.target.value})}
                disabled={isSubmitting}
              />
            </div>

            {/* Signature Info Box */}
            <div className="bg-surface-dark p-4 rounded-lg border border-green-500/20">
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#4ade80]" />
                Cryptographic Verification
              </h4>
              <p className="text-sm text-muted mb-2">
                Your bid will be signed with your wallet to prove authenticity. This ensures:
              </p>
              <ul className="text-sm text-muted space-y-1 ml-4">
                <li>• Your proposal cannot be tampered with</li>
                <li>• Your identity is cryptographically verified</li>
                <li>• The bid is recorded on the Stellar blockchain</li>
                <li>• Clients can trust the authenticity of your bid</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {submitState === 'validating' && 'Validating...'}
                    {submitState === 'signing' && 'Signing with wallet...'}
                    {submitState === 'verifying' && 'Verifying...'}
                    {submitState === 'submitting' && 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Submit Bid
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
