/**
 * USDC Setup Component
 * Helps users create USDC trustline and check their USDC status
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { checkUSDCTrustline, setupUSDCAccount } from '@/lib/stellar/payments';
import { toast } from 'sonner';

export function USDCSetup() {
  const wallet = useWallet();
  const [trustlineStatus, setTrustlineStatus] = useState<{
    exists: boolean;
    balance: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Check trustline status when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      checkTrustlineStatus();
    } else {
      setTrustlineStatus(null);
    }
  }, [wallet.connected, wallet.publicKey]);

  const checkTrustlineStatus = async () => {
    if (!wallet.publicKey) return;

    setIsChecking(true);
    try {
      const status = await checkUSDCTrustline(wallet.publicKey);
      setTrustlineStatus(status ? { exists: true, balance: status.balance } : { exists: false, balance: '0' });
    } catch (error) {
      console.error('Error checking trustline:', error);
      setTrustlineStatus({ exists: false, balance: '0' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSetup = async () => {
    if (!wallet.publicKey || !wallet.walletType) return;

    setIsSettingUp(true);
    try {
      const result = await setupUSDCAccount(wallet.publicKey, wallet.walletType);
      
      if (result.trustlineCreated) {
        toast.success('USDC Account Ready!', {
          description: result.message,
        });
        // Refresh trustline status
        await checkTrustlineStatus();
        // Refresh wallet balance
        await wallet.refreshBalance();
      } else {
        toast.error('Setup Failed', {
          description: result.message,
        });
      }
    } catch (error: any) {
      toast.error('Setup Error', {
        description: error.message || 'Failed to setup USDC account',
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  if (!wallet.connected) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            USDC Setup
          </CardTitle>
          <CardDescription>Connect your wallet to enable USDC payments</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isChecking) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking USDC Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (trustlineStatus?.exists) {
    return (
      <Card className="border-border bg-[#4ade80]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
            USDC Ready
            <Badge variant="outline" className="ml-auto text-xs bg-[#4ade80]/10 text-[#22c55e] border-[#4ade80]/20">
              Active
            </Badge>
          </CardTitle>
          <CardDescription>Your account can send and receive USDC</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">USDC Balance</span>
              <span className="text-lg font-semibold">{parseFloat(trustlineStatus.balance).toFixed(2)} USDC</span>
            </div>
            
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <AlertDescription className="text-sm text-blue-200">
                💡 You can now use USDC for escrow payments and receive USDC from completed projects!
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          USDC Not Enabled
        </CardTitle>
        <CardDescription>
          Create a USDC trustline to enable stablecoin payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertDescription className="text-sm">
              <strong>What is a trustline?</strong>
              <br />
              A trustline allows your Stellar account to hold and receive USDC (a USD stablecoin).
              This is a one-time setup that requires a small XLM fee (~0.5 XLM).
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#22c55e] mt-0.5" />
              <span>One-time setup (takes 5 seconds)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#22c55e] mt-0.5" />
              <span>Required to receive USDC payments</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#22c55e] mt-0.5" />
              <span>Costs ~0.5 XLM (network fee)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSetup}
              disabled={isSettingUp}
              className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white"
            >
              {isSettingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Trustline...
                </>
              ) : (
                'Enable USDC on My Account'
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={checkTrustlineStatus}
              className="w-full"
            >
              Check Status Again
            </Button>
          </div>

          <Alert className="bg-surface border-border">
            <AlertDescription className="text-xs text-muted-foreground">
              Need test XLM? Get free testnet XLM from{' '}
              <a
                href="https://laboratory.stellar.org/#account-creator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4ade80] hover:underline inline-flex items-center gap-1"
              >
                Stellar Laboratory
                <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
