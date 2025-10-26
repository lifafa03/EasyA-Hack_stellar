/**
 * Wallet Connect Button Component (Stellar Wallets Kit)
 * Uses the built-in UI modal from @creit.tech/stellar-wallets-kit
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Copy, Check, Clock, ChevronDown, ArrowDownToLine, ArrowUpFromLine, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWalletKit } from '@/hooks/use-wallet-kit';
import { useFiatBalance } from '@/hooks/use-fiat-balance';
import { toast } from 'sonner';
import Link from 'next/link';

export function WalletConnectButton() {
  const [copied, setCopied] = useState(false);
  const wallet = useWalletKit();
  const fiatBalance = useFiatBalance();

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-[#4ade80]/30 bg-[#4ade80]/5 hover:bg-[#4ade80]/10 text-white hover:text-white">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-[#4ade80]/10 text-[#22c55e] border-[#4ade80]/20 px-1.5 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse mr-1" />
                <span className="text-xs">Connected</span>
              </Badge>
              <span className="font-mono text-sm text-white">{formatAddress(wallet.publicKey)}</span>
              <ChevronDown className="h-4 w-4 opacity-50 text-white" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-black/95 backdrop-blur-xl border-white/10">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none text-white">Wallet Address</p>
                <button
                  onClick={handleCopyAddress}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs font-mono leading-none text-gray-400 break-all">
                {wallet.publicKey}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <div className="px-2 py-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">USDC Balance</span>
                <span className="font-semibold text-[#4ade80]">
                  ${formatBalance(wallet.usdcBalance)}
                  {parseFloat(fiatBalance.pendingOnRampAmount) > 0 && (
                    <span className="text-yellow-500 text-xs ml-1" title="Pending deposits">
                      (+${fiatBalance.pendingOnRampAmount})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">XLM Balance</span>
                <span className="font-semibold text-white">{formatBalance(wallet.balance)}</span>
              </div>
              {fiatBalance.hasPendingTransactions && (
                <div className="flex items-center gap-2 text-xs bg-yellow-500/10 text-yellow-500 rounded-md px-2 py-1.5 mt-2">
                  <Clock className="h-3 w-3" />
                  <span>{fiatBalance.pendingTransactions.length} pending transaction(s)</span>
                </div>
              )}
              {isUnfunded && (
                <a
                  href="https://laboratory.stellar.org/#account-creator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs bg-[#4ade80]/10 text-[#22c55e] rounded-md px-2 py-1.5 mt-2 hover:bg-[#4ade80]/20 transition-colors"
                >
                  <Wallet className="h-3 w-3" />
                  <span>Fund Account (Get Testnet XLM)</span>
                </a>
              )}
            </div>
          </div>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard?tab=deposit" className="cursor-pointer">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              <span>Deposit Funds</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard?tab=withdraw" className="cursor-pointer">
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              <span>Withdraw Funds</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={wallet.openModal} className="cursor-pointer">
            <Wallet className="mr-2 h-4 w-4" />
            <span>Switch Wallet</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={wallet.disconnect}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
