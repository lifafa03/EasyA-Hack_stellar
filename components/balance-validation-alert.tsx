/**
 * Balance Validation Alert Component
 * Reusable component for displaying balance validation messages
 * Shows insufficient balance errors with link to deposit page
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BalanceValidationResult, getBalanceValidationMessage, formatUSDC } from '@/lib/stellar/balance-validation';

interface BalanceValidationAlertProps {
  validationResult: BalanceValidationResult;
  showDetails?: boolean;
  className?: string;
}

export function BalanceValidationAlert({
  validationResult,
  showDetails = true,
  className = '',
}: BalanceValidationAlertProps) {
  const { title, message, action, actionLink } = getBalanceValidationMessage(validationResult);

  // Success state
  if (validationResult.isValid) {
    return (
      <Alert className={`bg-green-500/10 border-green-500/20 ${className}`}>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-500">{title}</AlertTitle>
        {showDetails && (
          <AlertDescription className="text-green-500/80">
            {message}
          </AlertDescription>
        )}
      </Alert>
    );
  }

  // Error state with deposit action
  if (validationResult.needsDeposit) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-3">
          <div>
            {message}
            {showDetails && validationResult.shortfall && (
              <div className="mt-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-mono">{formatUSDC(validationResult.available)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required:</span>
                  <span className="font-mono">{formatUSDC(validationResult.required)}</span>
                </div>
                <div className="flex justify-between border-t border-destructive/20 pt-1 mt-1">
                  <span className="text-muted-foreground">Shortfall:</span>
                  <span className="font-mono font-semibold">{formatUSDC(validationResult.shortfall)}</span>
                </div>
              </div>
            )}
          </div>
          {action && actionLink && (
            <Link href={actionLink}>
              <Button 
                size="sm" 
                className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
              >
                {action}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // General error state
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

interface BalanceDisplayProps {
  available: string;
  required: string;
  className?: string;
}

/**
 * Simple balance display component for modals
 */
export function BalanceDisplay({ available, required, className = '' }: BalanceDisplayProps) {
  const availableNum = parseFloat(available);
  const requiredNum = parseFloat(required);
  const isSufficient = availableNum >= requiredNum;

  return (
    <div className={`p-3 rounded-lg border ${
      isSufficient 
        ? 'bg-green-500/10 border-green-500/20' 
        : 'bg-destructive/10 border-destructive/20'
    } ${className}`}>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Available Balance:</span>
          <span className="font-mono font-semibold">{formatUSDC(available)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Required Amount:</span>
          <span className="font-mono font-semibold">{formatUSDC(required)}</span>
        </div>
        <div className={`flex justify-between border-t pt-2 ${
          isSufficient ? 'border-green-500/20' : 'border-destructive/20'
        }`}>
          <span className="text-muted-foreground">Status:</span>
          <span className={`font-semibold flex items-center gap-1 ${
            isSufficient ? 'text-green-500' : 'text-destructive'
          }`}>
            {isSufficient ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Sufficient
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Insufficient
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

interface TransactionWarningsProps {
  warnings: string[];
  className?: string;
}

/**
 * Display transaction warnings
 */
export function TransactionWarnings({ warnings, className = '' }: TransactionWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <Alert className={`bg-yellow-500/10 border-yellow-500/20 ${className}`}>
      <Info className="h-4 w-4 text-yellow-500" />
      <AlertTitle className="text-yellow-500">Important Information</AlertTitle>
      <AlertDescription>
        <ul className="space-y-1 mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          {warnings.map((warning, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
