'use client';

/**
 * Transaction Progress Indicator
 * Shows real-time progress for blockchain transactions
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Check, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  Clock,
  Wallet,
  Send,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Transaction step status
 */
export type TransactionStepStatus = 'pending' | 'active' | 'completed' | 'error';

/**
 * Transaction step
 */
export interface TransactionStep {
  id: string;
  label: string;
  description?: string;
  status: TransactionStepStatus;
  icon?: React.ReactNode;
}

/**
 * Transaction progress props
 */
export interface TransactionProgressProps {
  steps: TransactionStep[];
  currentStep?: string;
  transactionHash?: string;
  explorerUrl?: string;
  onViewExplorer?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Default transaction steps
 */
export const DEFAULT_TRANSACTION_STEPS: TransactionStep[] = [
  {
    id: 'prepare',
    label: 'Preparing',
    description: 'Building transaction',
    status: 'pending',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: 'sign',
    label: 'Signing',
    description: 'Waiting for wallet signature',
    status: 'pending',
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    id: 'submit',
    label: 'Submitting',
    description: 'Broadcasting to network',
    status: 'pending',
    icon: <Send className="h-4 w-4" />,
  },
  {
    id: 'confirm',
    label: 'Confirming',
    description: 'Waiting for confirmation',
    status: 'pending',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

/**
 * Transaction progress indicator component
 */
export function TransactionProgress({
  steps,
  currentStep,
  transactionHash,
  explorerUrl,
  onViewExplorer,
  onClose,
  className,
}: TransactionProgressProps) {
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const hasError = steps.some(s => s.status === 'error');
  const isComplete = completedSteps === totalSteps && !hasError;

  return (
    <Card className={cn('border-primary/50 bg-primary/5', hasError && 'border-destructive/50 bg-destructive/5', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : hasError ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            <div>
              <CardTitle className="text-base">
                {isComplete ? 'Transaction Complete' : hasError ? 'Transaction Failed' : 'Processing Transaction'}
              </CardTitle>
              <CardDescription>
                {isComplete 
                  ? 'Your transaction has been confirmed on the blockchain'
                  : hasError
                  ? 'An error occurred during transaction processing'
                  : `Step ${completedSteps + 1} of ${totalSteps}`}
              </CardDescription>
            </div>
          </div>
          {isComplete && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Success
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress 
            value={progress} 
            className={cn(
              'h-2',
              hasError && '[&>div]:bg-destructive'
            )} 
          />
          <p className="text-xs text-muted-foreground text-right">
            {completedSteps} of {totalSteps} steps completed
          </p>
        </div>

        {/* Transaction steps */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <TransactionStepItem
              key={step.id}
              step={step}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {/* Transaction hash */}
        {transactionHash && (
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <p className="font-medium mb-1">Transaction Hash:</p>
              <p className="font-mono break-all">{transactionHash}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {explorerUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onViewExplorer}
              asChild
            >
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </a>
            </Button>
          )}
          
          {onClose && isComplete && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>

        {/* Estimated time */}
        {!isComplete && !hasError && (
          <p className="text-xs text-muted-foreground text-center">
            Estimated time: 5-7 seconds
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Transaction step item component
 */
interface TransactionStepItemProps {
  step: TransactionStep;
  isLast: boolean;
}

function TransactionStepItem({ step, isLast }: TransactionStepItemProps) {
  const statusIcons = {
    pending: <div className="h-4 w-4 rounded-full border-2 border-muted" />,
    active: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    completed: <Check className="h-4 w-4 text-green-500" />,
    error: <AlertCircle className="h-4 w-4 text-destructive" />,
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full',
          step.status === 'completed' && 'bg-green-500/10',
          step.status === 'active' && 'bg-primary/10',
          step.status === 'error' && 'bg-destructive/10',
          step.status === 'pending' && 'bg-muted'
        )}>
          {statusIcons[step.status]}
        </div>
        {!isLast && (
          <div className={cn(
            'w-0.5 h-8 mt-1',
            step.status === 'completed' ? 'bg-green-500/30' : 'bg-muted'
          )} />
        )}
      </div>
      <div className="flex-1 pb-4">
        <p className={cn(
          'text-sm font-medium',
          step.status === 'active' && 'text-primary',
          step.status === 'completed' && 'text-green-500',
          step.status === 'error' && 'text-destructive',
          step.status === 'pending' && 'text-muted-foreground'
        )}>
          {step.label}
        </p>
        {step.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {step.description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for managing transaction progress
 */
export function useTransactionProgress() {
  const [steps, setSteps] = React.useState<TransactionStep[]>(DEFAULT_TRANSACTION_STEPS);
  const [currentStep, setCurrentStep] = React.useState<string | undefined>();
  const [transactionHash, setTransactionHash] = React.useState<string | undefined>();

  const updateStep = React.useCallback((stepId: string, status: TransactionStepStatus) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
    if (status === 'active') {
      setCurrentStep(stepId);
    }
  }, []);

  const startStep = React.useCallback((stepId: string) => {
    updateStep(stepId, 'active');
  }, [updateStep]);

  const completeStep = React.useCallback((stepId: string) => {
    updateStep(stepId, 'completed');
  }, [updateStep]);

  const errorStep = React.useCallback((stepId: string) => {
    updateStep(stepId, 'error');
  }, [updateStep]);

  const reset = React.useCallback(() => {
    setSteps(DEFAULT_TRANSACTION_STEPS);
    setCurrentStep(undefined);
    setTransactionHash(undefined);
  }, []);

  const setHash = React.useCallback((hash: string) => {
    setTransactionHash(hash);
  }, []);

  return {
    steps,
    currentStep,
    transactionHash,
    startStep,
    completeStep,
    errorStep,
    setHash,
    reset,
  };
}

/**
 * Compact transaction progress for inline display
 */
export interface CompactTransactionProgressProps {
  status: 'preparing' | 'signing' | 'submitting' | 'confirming' | 'completed' | 'error';
  message?: string;
  className?: string;
}

export function CompactTransactionProgress({
  status,
  message,
  className,
}: CompactTransactionProgressProps) {
  const statusConfig = {
    preparing: { icon: Clock, color: 'text-blue-500', label: 'Preparing...' },
    signing: { icon: Wallet, color: 'text-purple-500', label: 'Signing...' },
    submitting: { icon: Send, color: 'text-orange-500', label: 'Submitting...' },
    confirming: { icon: Loader2, color: 'text-primary', label: 'Confirming...' },
    completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
    error: { icon: AlertCircle, color: 'text-destructive', label: 'Failed' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn('h-4 w-4', config.color, status !== 'completed' && status !== 'error' && 'animate-spin')} />
      <span className="text-sm">{message || config.label}</span>
    </div>
  );
}
