/**
 * CreatePool Component
 * Form for creating new crowdfunding pools with goal and deadline
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Loader2, Target } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { CrowdfundingService, CreatePoolParams } from '@/lib/stellar/services/crowdfunding';
import { getStellarSDK } from '@/lib/stellar/sdk';
import { toast } from 'sonner';

export function CreatePool() {
  const wallet = useWallet();
  const [fundingGoal, setFundingGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fundingGoal || parseFloat(fundingGoal) <= 0) {
      newErrors.fundingGoal = 'Funding goal must be greater than 0';
    }

    if (!deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = 'Deadline must be in the future';
      }
      
      // Check if deadline is not too far (max 1 year)
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (deadlineDate > oneYearFromNow) {
        newErrors.deadline = 'Deadline cannot be more than 1 year in the future';
      }
    }

    if (!projectDescription.trim()) {
      newErrors.projectDescription = 'Project description is required';
    } else if (projectDescription.trim().length < 20) {
      newErrors.projectDescription = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  // Create pool
  const handleCreatePool = async () => {
    if (!wallet.publicKey) return;

    setIsCreating(true);
    try {
      const sdk = getStellarSDK();
      const crowdfundingService = new CrowdfundingService(sdk);

      const params: CreatePoolParams = {
        fundingGoal,
        deadline: Math.floor(new Date(deadline).getTime() / 1000),
        projectDescription,
      };

      // Create signer from wallet
      const signer = {
        sign: async (tx: any) => tx,
        getPublicKey: () => wallet.publicKey!,
      };

      const poolId = await crowdfundingService.createPool(params, signer);

      toast.success('Crowdfunding pool created successfully!', {
        description: `Pool ID: ${poolId.slice(0, 8)}...${poolId.slice(-8)}`,
      });

      // Reset form
      setShowConfirmation(false);
      setFundingGoal('');
      setDeadline('');
      setProjectDescription('');
      
      // Refresh wallet balance
      await wallet.refreshBalance();
    } catch (error: any) {
      console.error('Failed to create pool:', error);
      toast.error('Failed to create crowdfunding pool', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getMinDeadline = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  const getMaxDeadline = () => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return oneYearFromNow.toISOString().slice(0, 16);
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#4ade80]" />
            Create Crowdfunding Pool
          </CardTitle>
          <CardDescription>
            Launch a crowdfunding campaign to raise funds for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project, what you're building, and how the funds will be used..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className={errors.projectDescription ? 'border-destructive' : ''}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                {projectDescription.length} characters (minimum 20)
              </p>
              {errors.projectDescription && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.projectDescription}
                </p>
              )}
            </div>

            {/* Funding Goal */}
            <div className="space-y-2">
              <Label htmlFor="fundingGoal">Funding Goal (USDC)</Label>
              <Input
                id="fundingGoal"
                type="number"
                step="0.01"
                placeholder="10000.00"
                value={fundingGoal}
                onChange={(e) => setFundingGoal(e.target.value)}
                className={errors.fundingGoal ? 'border-destructive' : ''}
              />
              {errors.fundingGoal && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fundingGoal}
                </p>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Campaign Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={getMinDeadline()}
                max={getMaxDeadline()}
                className={errors.deadline ? 'border-destructive' : ''}
              />
              <p className="text-sm text-muted-foreground">
                Set when your crowdfunding campaign will end
              </p>
              {errors.deadline && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.deadline}
                </p>
              )}
            </div>

            {/* Info Box */}
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>How it works:</strong> Contributors can pledge funds until the deadline. 
                  If the funding goal is met, you can finalize the pool and access the funds. 
                  If the goal isn't met, contributors can request refunds.
                </p>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="submit"
                className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
                disabled={!wallet.connected || isCreating}
              >
                {!wallet.connected ? 'Connect Wallet First' : 'Create Pool'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Pool Creation</DialogTitle>
            <DialogDescription>
              Please review the pool details before creating
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Funding Goal:</span>
                <span className="font-semibold">{fundingGoal} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deadline:</span>
                <span className="font-semibold">
                  {new Date(deadline).toLocaleDateString()} at {new Date(deadline).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Project Owner:</span>
                <span className="font-mono text-xs">
                  {wallet.publicKey?.slice(0, 8)}...{wallet.publicKey?.slice(-8)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Important:</strong> Once created, the pool parameters cannot be modified. 
                Make sure all details are correct.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePool}
              disabled={isCreating}
              className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Confirm & Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
