'use client';

import { useWallet } from '@/hooks/use-wallet';
import { Card } from './ui/card';

export function WalletDebug() {
  const wallet = useWallet();

  return (
    <Card className="p-4 bg-yellow-500/10 border-yellow-500/50 fixed bottom-4 right-4 max-w-md z-50">
      <h3 className="font-bold text-yellow-600 mb-2">🔍 Wallet Debug Info</h3>
      <div className="text-xs space-y-1 font-mono">
        <div><strong>Connected:</strong> {wallet.connected ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Public Key:</strong> {wallet.publicKey || 'Not connected'}</div>
        <div><strong>Wallet Type:</strong> {wallet.walletType || 'None'}</div>
        <div><strong>XLM Balance:</strong> {wallet.balance || 'null'}</div>
        <div><strong>USDC Balance:</strong> {wallet.usdcBalance || 'null'}</div>
        <div><strong>Loading:</strong> {wallet.isLoading ? 'Yes' : 'No'}</div>
        {wallet.error && <div className="text-red-600"><strong>Error:</strong> {wallet.error}</div>}
      </div>
      <div className="mt-2 pt-2 border-t border-yellow-500/30 text-xs text-yellow-700">
        Check browser console for balance fetch logs
      </div>
    </Card>
  );
}
