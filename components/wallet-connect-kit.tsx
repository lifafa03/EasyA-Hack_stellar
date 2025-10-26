/**
 * Wallet Connect Button Component (Stellar Wallets Kit)
 * Uses the built-in UI modal from @creit.tech/stellar-wallets-kit
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useWalletKit } from '@/hooks/use-wallet-kit';
import { toast } from 'sonner';

export function WalletConnectButton() {
  const [copied, setCopied] = useState(false);
  const wallet = useWalletKit();

  const handleCopyAddress = () => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatBalance = (balance: string | null) => {
    if (!balance) return '0.00';
    return parseFloat(balance).toFixed(2);
  };

  if (wallet.connected && wallet.publicKey) {
    const isUnfunded = wallet.balance === '0' && wallet.usdcBalance === '0';
    
    return (
      <div className="flex items-center gap-3">
        <Card className="px-4 py-2 bg-surface border-border">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-semibold">{formatAddress(wallet.publicKey)}</span>
                <button
                  onClick={handleCopyAddress}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <Badge variant="outline" className="text-xs bg-[#4ade80]/10 text-[#22c55e] border-[#4ade80]/20">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatBalance(wallet.usdcBalance)} USDC</span>
                <span>•</span>
                <span>{formatBalance(wallet.balance)} XLM</span>
                {isUnfunded && (
                  <>
                    <span>•</span>
                    <a
                      href="https://laboratory.stellar.org/#account-creator"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#22c55e] hover:text-[#4ade80] underline"
                      title="Get free testnet XLM"
                    >
                      Fund Account
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        <Button
          variant="outline"
          size="sm"
          onClick={wallet.openModal}
          className="border-border hover:bg-surface"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Switch
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
    <Button
      onClick={wallet.openModal}
      className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
      disabled={wallet.isLoading}
    >
      <Wallet className="h-4 w-4 mr-2" />
      {wallet.isLoading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
