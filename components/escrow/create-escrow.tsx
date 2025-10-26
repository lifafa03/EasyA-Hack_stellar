/**
 * CreateEscrow Component
 * Form for creating new escrow contracts with milestone-based or time-based releases
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { EscrowService, CreateEscrowParams, MilestoneConfig, TimeReleaseConfig } from '@/lib/stellar/services/escrow';
import { getStellarSDK } from '@/lib/stellar/sdk';
import { toast } from 'sonner';
import { preTransactionValidation } from '@/lib/stellar/balance-validation';
import { BalanceValidationAlert, TransactionWarnings } from '@/components/balance-validation-alert';

type ReleaseType = 'milestone-based' | 'time-based';

interface Milestone {
  id: number;
  description: string;
  amount: string;
}

interface TimeRelease {
  id: number;
  releaseDate: string; // ISO date string
  amount: string;
}

export function CreateEscrow() {
  const wallet = useWallet();
  const [releaseType, setReleaseType] = useState<ReleaseType>('milestone-based');
  const [providerAddress, setProviderAddress] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, description: '', amount: '' }
  ]);
  const [timeSchedule, setTimeSchedule] = useState<TimeRelease[]>([
    { id: 1, releaseDate: '', amount: '' }
  ]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [balanceValidation, setBalanceValidation] = useState<any>(null);

  // Validation
  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (!providerAddress.trim()) {
      newErrors.providerAddress = 'Provider address is required';
    } else if (providerAddress.length !== 56 || !providerAddress.startsWith('G')) {
      newErrors.providerAddress = 'Invalid Stellar address';
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0';
    }

    // Validate USDC balance using the validation utility
    if (wallet.publicKey && totalAmount) {
      try {
        const validation = await preTransactionValidation(
          wallet.publicKey,
          totalAmount,
          'escrow'
        );
        setBalanceValidation(validation);
        
        if (!validation.canProceed) {
          newErrors.totalAmount = 'Insufficient USDC balance';
        }
      } catch (error) {
        console.error('Balance validation error:', error);
      }
    }

    if (releaseType === 'milestone-based') {
      if (milestones.length === 0) {
        newErrors.milestones = 'At least one milestone is required';
      }

      milestones.forEach((milestone, index) => {
        if (!milestone.description.trim()) {
          newErrors[`milestone_${index}_description`] = 'Description is required';
        }
        if (!milestone.amount || parseFloat(milestone.amount) <= 0) {
          newErrors[`milestone_${index}_amount`] = 'Amount must be greater than 0';
        }
      });

      // Check if milestone amounts sum to total
      const milestonesTotal = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
      if (totalAmount && Math.abs(milestonesTotal - parseFloat(totalAmount)) > 0.01) {
        newErrors.milestones = `Milestone amounts (${milestonesTotal.toFixed(2)}) must equal total amount (${totalAmount})`;
      }
    } else {
      if (timeSchedule.length === 0) {
        newErrors.timeSchedule = 'At least one release date is required';
      }

      timeSchedule.forEach((release, index) => {
        if (!release.releaseDate) {
          newErrors[`release_${index}_date`] = 'Release date is required';
        } else {
          const releaseDate = new Date(release.releaseDate);
          if (releaseDate <= new Date()) {
            newErrors[`release_${index}_date`] = 'Release date must be in the future';
          }
        }
        if (!release.amount || parseFloat(release.amount) <= 0) {
          newErrors[`release_${index}_amount`] = 'Amount must be greater than 0';
        }
      });

      // Check if schedule amounts sum to total
      const scheduleTotal = timeSchedule.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      if (totalAmount && Math.abs(scheduleTotal - parseFloat(totalAmount)) > 0.01) {
        newErrors.timeSchedule = `Release amounts (${scheduleTotal.toFixed(2)}) must equal total amount (${totalAmount})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Milestone management
  const addMilestone = () => {
    const newId = Math.max(...milestones.map(m => m.id), 0) + 1;
    setMilestones([...milestones, { id: newId, description: '', amount: '' }]);
  };

  const removeMilestone = (id: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  const updateMilestone = (id: number, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  // Time schedule management
  const addTimeRelease = () => {
    const newId = Math.max(...timeSchedule.map(t => t.id), 0) + 1;
    setTimeSchedule([...timeSchedule, { id: newId, releaseDate: '', amount: '' }]);
  };

  const removeTimeRelease = (id: number) => {
    if (timeSchedule.length > 1) {
      setTimeSchedule(timeSchedule.filter(t => t.id !== id));
    }
  };

  const updateTimeRelease = (id: number, field: keyof TimeRelease, value: string) => {
    setTimeSchedule(timeSchedule.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const isValid = await validateForm();
    if (isValid) {
      setShowConfirmation(true);
    }
  };

  // Create escrow contract
  const handleCreateEscrow = async () => {
    if (!wallet.publicKey) return;

    setIsCreating(true);
    try {
      const sdk = getStellarSDK();
      const escrowService = new EscrowService(sdk);

      const params: CreateEscrowParams = {
        provider: providerAddress,
        totalAmount,
        releaseType,
      };

      if (releaseType === 'milestone-based') {
        params.milestones = milestones.map((m, index) => ({
          id: index,
          description: m.description,
          amount: m.amount,
        }));
      } else {
        params.timeSchedule = timeSchedule.map(t => ({
          releaseDate: Math.floor(new Date(t.releaseDate).getTime() / 1000),
          amount: t.amount,
        }));
      }

      // Create signer from wallet
      const signer = {
        sign: async (tx: any) => {
          // This would use the wallet to sign
          // For now, simplified implementation
          return tx;
        },
        getPublicKey: () => wallet.publicKey!,
      };

      const contractId = await escrowService.createEscrow(params, signer);

      toast.success('Escrow contract created successfully!', {
        description: `Contract ID: ${contractId.slice(0, 8)}...${contractId.slice(-8)}`,
      });

      // Reset form
      setShowConfirmation(false);
      setProviderAddress('');
      setTotalAmount('');
      setMilestones([{ id: 1, description: '', amount: '' }]);
      setTimeSchedule([{ id: 1, releaseDate: '', amount: '' }]);
      
      // Refresh wallet balance
      await wallet.refreshBalance();
    } catch (error: any) {
      console.error('Failed to create escrow:', error);
      toast.error('Failed to create escrow contract', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const calculateRemainingAmount = () => {
    const total = parseFloat(totalAmount) || 0;
    if (releaseType === 'milestone-based') {
      const allocated = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
      return total - allocated;
    } else {
      const allocated = timeSchedule.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      return total - allocated;
    }
  };

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create Escrow Contract</CardTitle>
          <CardDescription>
            Set up a secure escrow contract with milestone-based or time-based payment releases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Balance Validation Alert */}
            {balanceValidation && !balanceValidation.canProceed && (
              <BalanceValidationAlert 
                validationResult={balanceValidation.validationResult}
                showDetails={true}
              />
            )}

            {/* Transaction Warnings */}
            {balanceValidation?.warnings && balanceValidation.canProceed && (
              <TransactionWarnings warnings={balanceValidation.warnings} />
            )}

            {/* Provider Address */}
            <div className="space-y-2">
              <Label htmlFor="provider">Service Provider Address</Label>
              <Input
                id="provider"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={providerAddress}
                onChange={(e) => setProviderAddress(e.target.value)}
                className={errors.providerAddress ? 'border-destructive' : ''}
              />
              {errors.providerAddress && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.providerAddress}
                </p>
              )}
            </div>

            {/* Total Amount */}
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount (USDC)</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className={errors.totalAmount ? 'border-destructive' : ''}
              />
              {wallet.usdcBalance && (
                <p className="text-sm text-muted-foreground">
                  Available balance: {parseFloat(wallet.usdcBalance).toFixed(2)} USDC
                </p>
              )}
              {errors.totalAmount && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.totalAmount}
                </p>
              )}
            </div>

            {/* Release Type Selector */}
            <div className="space-y-2">
              <Label>Release Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${
                    releaseType === 'milestone-based'
                      ? 'border-[#4ade80] bg-[#4ade80]/5'
                      : 'hover:border-border/80'
                  }`}
                  onClick={() => setReleaseType('milestone-based')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${
                        releaseType === 'milestone-based' ? 'text-[#22c55e]' : 'text-muted-foreground'
                      }`} />
                      <div>
                        <h3 className="font-semibold mb-1">Milestone-Based</h3>
                        <p className="text-sm text-muted-foreground">
                          Release funds when specific milestones are completed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    releaseType === 'time-based'
                      ? 'border-[#4ade80] bg-[#4ade80]/5'
                      : 'hover:border-border/80'
                  }`}
                  onClick={() => setReleaseType('time-based')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Calendar className={`h-5 w-5 mt-0.5 ${
                        releaseType === 'time-based' ? 'text-[#22c55e]' : 'text-muted-foreground'
                      }`} />
                      <div>
                        <h3 className="font-semibold mb-1">Time-Based</h3>
                        <p className="text-sm text-muted-foreground">
                          Release funds automatically on scheduled dates
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Milestone Builder */}
            {releaseType === 'milestone-based' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Milestones</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMilestone}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>

                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <Card key={milestone.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Milestone {index + 1}</Badge>
                          {milestones.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeMilestone(milestone.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`milestone-desc-${milestone.id}`}>Description</Label>
                          <Input
                            id={`milestone-desc-${milestone.id}`}
                            placeholder="e.g., Complete initial design mockups"
                            value={milestone.description}
                            onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                            className={errors[`milestone_${index}_description`] ? 'border-destructive' : ''}
                          />
                          {errors[`milestone_${index}_description`] && (
                            <p className="text-sm text-destructive">{errors[`milestone_${index}_description`]}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`milestone-amount-${milestone.id}`}>Amount (USDC)</Label>
                          <Input
                            id={`milestone-amount-${milestone.id}`}
                            type="number"
                            step="0.01"
                            placeholder="250.00"
                            value={milestone.amount}
                            onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                            className={errors[`milestone_${index}_amount`] ? 'border-destructive' : ''}
                          />
                          {errors[`milestone_${index}_amount`] && (
                            <p className="text-sm text-destructive">{errors[`milestone_${index}_amount`]}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {errors.milestones && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.milestones}
                  </p>
                )}
              </div>
            )}

            {/* Time Schedule Builder */}
            {releaseType === 'time-based' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Release Schedule</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTimeRelease}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Release
                  </Button>
                </div>

                <div className="space-y-3">
                  {timeSchedule.map((release, index) => (
                    <Card key={release.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Release {index + 1}</Badge>
                          {timeSchedule.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeTimeRelease(release.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`release-date-${release.id}`}>Release Date</Label>
                            <Input
                              id={`release-date-${release.id}`}
                              type="datetime-local"
                              value={release.releaseDate}
                              onChange={(e) => updateTimeRelease(release.id, 'releaseDate', e.target.value)}
                              className={errors[`release_${index}_date`] ? 'border-destructive' : ''}
                            />
                            {errors[`release_${index}_date`] && (
                              <p className="text-sm text-destructive">{errors[`release_${index}_date`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`release-amount-${release.id}`}>Amount (USDC)</Label>
                            <Input
                              id={`release-amount-${release.id}`}
                              type="number"
                              step="0.01"
                              placeholder="250.00"
                              value={release.amount}
                              onChange={(e) => updateTimeRelease(release.id, 'amount', e.target.value)}
                              className={errors[`release_${index}_amount`] ? 'border-destructive' : ''}
                            />
                            {errors[`release_${index}_amount`] && (
                              <p className="text-sm text-destructive">{errors[`release_${index}_amount`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {errors.timeSchedule && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.timeSchedule}
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            {totalAmount && (
              <Card className="bg-surface-dark">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold">{parseFloat(totalAmount).toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Allocated:</span>
                      <span className="font-semibold">
                        {(parseFloat(totalAmount) - calculateRemainingAmount()).toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className={`font-semibold ${
                        Math.abs(calculateRemainingAmount()) > 0.01 ? 'text-yellow-500' : 'text-[#22c55e]'
                      }`}>
                        {calculateRemainingAmount().toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="submit"
                className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
                disabled={!wallet.connected || isCreating}
              >
                {!wallet.connected ? 'Connect Wallet First' : 'Create Escrow Contract'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Escrow Creation</DialogTitle>
            <DialogDescription>
              Please review the escrow details before creating the contract
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-mono text-xs">{providerAddress.slice(0, 8)}...{providerAddress.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">{totalAmount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Release Type:</span>
                <span className="font-semibold capitalize">{releaseType.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {releaseType === 'milestone-based' ? 'Milestones:' : 'Releases:'}
                </span>
                <span className="font-semibold">
                  {releaseType === 'milestone-based' ? milestones.length : timeSchedule.length}
                </span>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Important:</strong> Once created, the escrow contract cannot be modified. 
                Funds will be locked until release conditions are met.
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
              onClick={handleCreateEscrow}
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
