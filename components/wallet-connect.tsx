/**
 * Wallet Connect Button Component
 * Provides UI for connecting Stellar wallets (Freighter, Albedo)
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, LogOut, ExternalLink, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/use-wallet';
import { toast } from 'sonner';

export function WalletConnectButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const wallet = useWallet();

  const handleConnect = async (walletType: 'freighter' | 'albedo') => {
    try {
      await wallet.connect(walletType);
      setShowDialog(false);
    } catch (error: any) {
      console.error('Connection error:', error);
      // Error toast is handled in the hook
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await wallet.refreshBalance();
      toast.success('Balance refreshed!');
    } catch (error) {
      toast.error('Failed to refresh balance');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatBalance = (balance: string | null) => {
    if (!balance || balance === '0' || balance === '0.0000000') return '0.00';
    const num = parseFloat(balance);
    // Show up to 7 decimal places for small amounts, 2 for larger
    if (num < 0.01 && num > 0) {
      return num.toFixed(7);
    }
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  if (wallet.connected && wallet.publicKey) {
    return (
      <div className="flex items-center gap-3">
        <Card className="px-4 py-2 bg-surface border-border">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-semibold">{formatAddress(wallet.publicKey)}</span>
                <Badge variant="outline" className="text-xs bg-[#4ade80]/10 text-[#22c55e] border-[#4ade80]/20">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">{formatBalance(wallet.usdcBalance)} USDC</span>
                <span>•</span>
                <span className="font-mono">{formatBalance(wallet.balance)} XLM</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshBalance}
          disabled={isRefreshing}
          className="border border-border hover:bg-surface-dark"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={wallet.disconnect}
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
        disabled={wallet.isLoading}
      >
        <Wallet className="h-4 w-4 mr-2" />
        {wallet.isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to StellarWork+. Your wallet will be used for all transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {/* Freighter Wallet */}
            <Card
              className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#4ade80]/50"
              onClick={() => handleConnect('freighter')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Freighter</h3>
                    <p className="text-sm text-muted-foreground">Browser extension</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-[#4ade80]/10 text-[#22c55e] border-[#4ade80]/20">
                  Recommended
                </Badge>
              </div>
            </Card>

            {/* Albedo Wallet */}
            <Card
              className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#4ade80]/50"
              onClick={() => handleConnect('albedo')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Albedo</h3>
                    <p className="text-sm text-muted-foreground">Web-based wallet</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-surface-dark rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have a Stellar wallet yet?
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://freighter.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                >
                  Get Freighter Wallet
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://albedo.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                >
                  Use Albedo Wallet
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
