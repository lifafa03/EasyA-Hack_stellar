'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, CheckCircle2, AlertCircle, ArrowRightLeft, LogOut, Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { toast } from 'sonner';

declare global {
  interface Window {
    freighterApi?: any;
  }
}

interface Balance {
  asset_code?: string;
  asset_type: string;
  balance: string;
  asset_issuer?: string;
}

export default function RampPage() {
  const wallet = useWallet();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [swapAmount, setSwapAmount] = useState('100');
  const [withdrawAmount, setWithdrawAmount] = useState('10');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [withdrawalUrl, setWithdrawalUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [withdrawalStatus, setWithdrawalStatus] = useState<string | null>(null);
  const [autoPolling, setAutoPolling] = useState(false);

  const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  // Auto-poll withdrawal status
  useEffect(() => {
    if (!autoPolling || !transactionId || !jwtToken) return;
    
    const pollInterval = setInterval(() => {
      console.log('🔄 Auto-polling withdrawal status...');
      checkWithdrawalStatus();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [autoPolling, transactionId, jwtToken]);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchBalances(wallet.publicKey);
    }
  }, [wallet.connected, wallet.publicKey]);

  // Fetch account balances from Horizon
  const fetchBalances = async (address: string) => {
    try {
      setStatus('Fetching balances...');
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${address}`
      );
      
      if (!response.ok) {
        throw new Error('Account not found on-chain');
      }

      const account = await response.json();
      setBalances(account.balances);
      setStatus('Balances updated!');
      setError('');
    } catch (err: any) {
      setError(`Failed to fetch balances: ${err.message}`);
      setStatus('');
    }
  };

  // Get balance for specific asset
  const getBalance = (assetCode?: string) => {
    if (!assetCode) {
      const nativeBalance = balances.find(b => b.asset_type === 'native');
      return nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : '0.00';
    }

    const assetBalance = balances.find(
      b => b.asset_code === assetCode && 
           (assetCode !== 'USDC' || b.asset_issuer === USDC_ISSUER)
    );
    return assetBalance ? parseFloat(assetBalance.balance).toFixed(2) : '0.00';
  };

  // Check if USDC trustline exists
  const hasUSDCTrustline = () => {
    return balances.some(
      b => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );
  };

  // Swap XLM to USDC using path payment
  const swapXLMtoUSDC = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStatus('Finding best swap path...');

      if (!wallet.publicKey || !wallet.walletType) {
        throw new Error('Wallet not connected');
      }

      if (!hasUSDCTrustline()) {
        throw new Error('USDC trustline not found. Please add USDC trustline first.');
      }

      // Import Stellar SDK and wallet utilities
      const StellarSDK = await import('@stellar/stellar-sdk');
      const { signAndSubmitTransaction } = await import('@/lib/stellar/wallet');
      const server = new StellarSDK.Horizon.Server('https://horizon-testnet.stellar.org');

      // Find path for swap
      const sourceAsset = StellarSDK.Asset.native();
      const destAsset = new StellarSDK.Asset('USDC', USDC_ISSUER);

      setStatus('Searching for swap path...');
      const paths = await server
        .strictSendPaths(sourceAsset, swapAmount, [destAsset])
        .call();

      if (!paths.records || paths.records.length === 0) {
        throw new Error('No swap path found. DEX might not have liquidity.');
      }

      const bestPath = paths.records[0];
      setStatus(`Found path! You'll receive ~${parseFloat(bestPath.destination_amount).toFixed(2)} USDC`);

      // Load account
      const account = await server.loadAccount(wallet.publicKey);

      // Build transaction
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: StellarSDK.Networks.TESTNET,
      })
        .addOperation(
          StellarSDK.Operation.pathPaymentStrictSend({
            sendAsset: sourceAsset,
            sendAmount: swapAmount,
            destination: wallet.publicKey,
            destAsset: destAsset,
            destMin: (parseFloat(bestPath.destination_amount) * 0.99).toFixed(7), // 1% slippage
          })
        )
        .setTimeout(180)
        .build();

      setStatus('Please sign transaction in your wallet...');

      // Sign and submit using the wallet service
      const result = await signAndSubmitTransaction(transaction, wallet.walletType);

      const txLink = `https://stellar.expert/explorer/testnet/tx/${result.hash}`;
      setStatus(
        `✅ Swap successful! ${swapAmount} XLM → ${parseFloat(bestPath.destination_amount).toFixed(2)} USDC\n` +
        `📋 Transaction: ${result.hash.slice(0, 8)}...${result.hash.slice(-8)}`
      );
      
      // Refresh balances
      await fetchBalances(wallet.publicKey);
      await wallet.refreshBalance();
      
      // Show success with link to transaction
      toast.success('Swap successful!', {
        description: `${swapAmount} XLM → ${parseFloat(bestPath.destination_amount).toFixed(2)} USDC`,
        action: {
          label: 'View on Stellar Expert',
          onClick: () => window.open(txLink, '_blank')
        },
        duration: 10000,
      });

      console.log('🔗 Swap Transaction:', txLink);
      
      // Save transaction hash to state
      setLastTxHash(result.hash);

      return result.hash;
    } catch (err: any) {
      setError(`Swap failed: ${err.message}`);
      toast.error('Swap failed', { description: err.message });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add USDC trustline
  const addUSDCTrustline = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStatus('Adding USDC trustline...');

      if (!wallet.publicKey || !wallet.walletType) {
        throw new Error('Wallet not connected');
      }

      // Import Stellar SDK and wallet utilities
      const StellarSDK = await import('@stellar/stellar-sdk');
      const { signAndSubmitTransaction } = await import('@/lib/stellar/wallet');
      const server = new StellarSDK.Horizon.Server('https://horizon-testnet.stellar.org');

      const account = await server.loadAccount(wallet.publicKey);

      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: StellarSDK.Networks.TESTNET,
      })
        .addOperation(
          StellarSDK.Operation.changeTrust({
            asset: new StellarSDK.Asset('USDC', USDC_ISSUER),
          })
        )
        .setTimeout(180)
        .build();

      setStatus('Please sign in your wallet...');

      // Sign and submit using the wallet service
      const result = await signAndSubmitTransaction(transaction, wallet.walletType);

      setStatus('✅ USDC trustline added successfully!');
      await fetchBalances(wallet.publicKey);
      await wallet.refreshBalance();
      toast.success('USDC trustline added successfully!');

      return result.hash;
    } catch (err: any) {
      setError(`Failed to add trustline: ${err.message}`);
      toast.error('Failed to add trustline', { description: err.message });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // SEP-24 withdrawal (placeholder for now)
  const initiateWithdrawal = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStatus('Initiating SEP-24 withdrawal...');

      if (!wallet.publicKey || !wallet.walletType) {
        throw new Error('Wallet not connected');
      }

      // Step 1: Get SEP-10 challenge
      setStatus('Step 1/4: Requesting authentication challenge...');
      const challengeRes = await fetch(`/api/sep10/challenge?account=${wallet.publicKey}`);
      const challengeData = await challengeRes.json();

      if (!challengeData.success) {
        throw new Error(challengeData.error || 'Failed to get challenge');
      }

      // Step 2: Sign challenge with wallet
      setStatus('Step 2/4: Please sign the authentication challenge in your wallet...');
      
      // Import Freighter API (same as we use for wallet connection)
      const { signTransaction } = await import('@stellar/freighter-api');
      
      // Sign the challenge XDR
      // Note: This is signing only, NOT submitting to network
      let signedXdr: string;
      
      try {
        const signResult = await signTransaction(challengeData.transaction, {
          networkPassphrase: challengeData.network_passphrase || 'Test SDF Network ; September 2015',
        });
        
        // Check for errors in the result
        if (signResult.error) {
          throw new Error(signResult.error);
        }
        
        // Extract the signed XDR from the result
        signedXdr = signResult.signedTxXdr;
        
      } catch (e: any) {
        if (e.message?.includes('User declined')) {
          throw new Error('You need to approve the signature in Freighter to continue');
        }
        throw new Error(`Freighter signing failed: ${e.message}`);
      }

      // Step 3: Get JWT token
      setStatus('Step 3/4: Getting authentication token...');
      const tokenRes = await fetch('/api/sep10/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransaction: signedXdr }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenData.success) {
        throw new Error(tokenData.error || 'Failed to get token');
      }

      setJwtToken(tokenData.token);
      toast.success('✅ Authenticated with anchor!');

      // Step 4: Initiate withdrawal
      setStatus('Step 4/4: Initiating withdrawal...');
      const withdrawRes = await fetch('/api/sep24/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenData.token,
          asset_code: 'USDC',
          asset_issuer: USDC_ISSUER,
          account: wallet.publicKey,
          amount: withdrawAmount,
        }),
      });

      const withdrawData = await withdrawRes.json();

      if (!withdrawData.success) {
        throw new Error(withdrawData.error || 'Failed to initiate withdrawal');
      }

      setWithdrawalUrl(withdrawData.url);
      setTransactionId(withdrawData.id);
      setStatus('✅ Withdrawal initiated! Opening interactive flow...');

      toast.success('Withdrawal initiated!', {
        description: 'Complete the KYC/withdrawal form in the popup',
        duration: 10000,
      });

      // Open interactive URL in popup
      if (withdrawData.url) {
        window.open(withdrawData.url, 'sep24', 'width=500,height=700');
      }

    } catch (err: any) {
      setError(`Withdrawal failed: ${err.message}`);
      toast.error('Withdrawal failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Check withdrawal status
  const checkWithdrawalStatus = async () => {
    if (!transactionId || !jwtToken) {
      toast.error('No withdrawal in progress');
      return;
    }

    try {
      const res = await fetch(`/api/sep24/transaction?id=${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get status');
      }

      const tx = data.transaction;
      
      console.log('📊 Full transaction details:', JSON.stringify(tx, null, 2));
      
      // Save current status
      setWithdrawalStatus(tx.status);
      
      // Stop auto-polling if withdrawal is in terminal state
      if (tx.status === 'completed' || tx.status === 'error' || tx.status === 'expired') {
        setAutoPolling(false);
        console.log('🛑 Stopping auto-poll - withdrawal in terminal state:', tx.status);
      }
      
      // Show detailed status message
      let statusMessage = tx.message || tx.status_message || 'Check the details below';
      
      // If waiting for user transfer, show the deposit instructions
      if (tx.status === 'pending_user_transfer_start') {
        statusMessage = `Please click "💸 Send USDC" to transfer ${withdrawAmount} USDC to the anchor`;
        if (tx.deposit_memo) {
          statusMessage += `\nMemo: ${tx.deposit_memo}`;
        }
      } else if (tx.status === 'pending_anchor') {
        statusMessage = 'Anchor has received your USDC and is processing the withdrawal. This may take a while on testnet.';
      } else if (tx.status === 'pending_external') {
        statusMessage = 'Withdrawal is being processed by external systems (banking)';
      } else if (tx.status === 'completed') {
        statusMessage = `✅ Withdrawal complete! Check your bank account.`;
      } else if (tx.status === 'error' || tx.status === 'expired') {
        statusMessage = `❌ Withdrawal failed: ${tx.message || 'Unknown error'}`;
      }
      
      toast.info(`Status: ${tx.status}`, {
        description: statusMessage,
        duration: 10000,
      });

      setStatus(`Withdrawal status: ${tx.status}\n${statusMessage}\n\nFull status: ${tx.status_eta || 'Processing...'}`);
      
      // Log all transaction fields
      console.log('🔍 Transaction fields:', {
        id: tx.id,
        status: tx.status,
        status_eta: tx.status_eta,
        message: tx.message,
        amount_in: tx.amount_in,
        amount_out: tx.amount_out,
        deposit_address: tx.deposit_address || tx.withdraw_anchor_account,
        deposit_memo: tx.deposit_memo,
        completed_at: tx.completed_at,
        started_at: tx.started_at,
      });
      
      return tx;
    } catch (err: any) {
      toast.error('Failed to check status', { description: err.message });
    }
  };

  // Send USDC to anchor to complete withdrawal
  const sendUSDCToAnchor = async () => {
    if (!transactionId || !jwtToken) {
      toast.error('No withdrawal in progress');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Getting deposit instructions from anchor...');

      // First, get the latest transaction details to get deposit address and memo
      const statusRes = await fetch(`/api/sep24/transaction?id=${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      });

      const statusData = await statusRes.json();
      if (!statusData.success) {
        throw new Error('Failed to get transaction details');
      }

      const tx = statusData.transaction;
      
      // Extract deposit information
      const depositAddress = tx.deposit_address || tx.withdraw_anchor_account;
      const depositMemo = tx.deposit_memo;
      const depositMemoType = tx.deposit_memo_type || 'text';
      
      if (!depositAddress) {
        throw new Error('Anchor has not provided a deposit address yet. Please try again in a moment.');
      }

      setStatus(`Sending ${withdrawAmount} USDC to anchor...`);

      // Build and send the payment transaction
      const StellarSDK = await import('@stellar/stellar-sdk');
      const { signAndSubmitTransaction } = await import('@/lib/stellar/wallet');
      
      const server = new StellarSDK.Horizon.Server('https://horizon-testnet.stellar.org');
      const account = await server.loadAccount(wallet.publicKey!);

      // Build payment operation
      const payment = StellarSDK.Operation.payment({
        destination: depositAddress,
        asset: new StellarSDK.Asset('USDC', USDC_ISSUER),
        amount: withdrawAmount,
      });

      const transactionBuilder = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: StellarSDK.Networks.TESTNET,
      }).addOperation(payment);

      // Add memo if provided
      if (depositMemo) {
        if (depositMemoType === 'hash') {
          transactionBuilder.addMemo(StellarSDK.Memo.hash(depositMemo));
        } else if (depositMemoType === 'id') {
          transactionBuilder.addMemo(StellarSDK.Memo.id(depositMemo));
        } else {
          transactionBuilder.addMemo(StellarSDK.Memo.text(depositMemo));
        }
      }

      const transaction = transactionBuilder.setTimeout(180).build();

      setStatus('Please approve the payment in your wallet...');

      // Sign and submit
      const result = await signAndSubmitTransaction(transaction, wallet.walletType!);

      const txLink = `https://stellar.expert/explorer/testnet/tx/${result.hash}`;
      
      setStatus(`✅ Payment sent! The anchor will process your withdrawal.\n📋 TX: ${result.hash.slice(0, 8)}...${result.hash.slice(-8)}`);
      
      toast.success('Payment sent to anchor!', {
        description: `${withdrawAmount} USDC sent. The anchor will now process your withdrawal.`,
        action: {
          label: 'View Transaction',
          onClick: () => window.open(txLink, '_blank')
        },
        duration: 15000,
      });

      // Refresh balances
      await fetchBalances(wallet.publicKey!);
      await wallet.refreshBalance();

      // Start auto-polling
      setAutoPolling(true);
      console.log('✅ Started auto-polling withdrawal status');

      // Wait a bit then check status
      setTimeout(() => {
        checkWithdrawalStatus();
      }, 3000);

    } catch (err: any) {
      setError(`Failed to send USDC: ${err.message}`);
      toast.error('Payment failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Stellar Off-Ramp</h1>
          <p className="text-muted-foreground">
            Convert XLM to USDC and withdraw to fiat using SEP-24 anchors
          </p>
        </div>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>
              {wallet.connected 
                ? 'Your wallet is connected' 
                : 'Connect your wallet using the button in the header'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!wallet.connected ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet using the &quot;Connect Wallet&quot; button in the header to use the off-ramp features.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Connected Address</p>
                    <p className="font-mono text-sm">{wallet.publicKey?.slice(0, 8)}...{wallet.publicKey?.slice(-8)}</p>
                  </div>
                  <Button onClick={wallet.disconnect} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
                
                <Button 
                  onClick={() => wallet.publicKey && fetchBalances(wallet.publicKey)} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Refresh Balances
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balances */}
        {wallet.connected && (
          <Card>
            <CardHeader>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>
                Live balances from Stellar Testnet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">XLM Balance</p>
                  <p className="text-2xl font-bold">{getBalance()} XLM</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">USDC Balance</p>
                  <p className="text-2xl font-bold">{getBalance('USDC')} USDC</p>
                  {!hasUSDCTrustline() && (
                    <Badge variant="destructive" className="mt-2">No Trustline</Badge>
                  )}
                </div>
              </div>

              {!hasUSDCTrustline() && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to add a USDC trustline before swapping.
                    <Button 
                      onClick={addUSDCTrustline} 
                      disabled={isLoading}
                      size="sm"
                      className="ml-2"
                    >
                      Add Trustline
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Swap XLM to USDC */}
        {wallet.connected && hasUSDCTrustline() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Swap XLM → USDC
              </CardTitle>
              <CardDescription>
                Convert XLM to USDC using Stellar DEX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="swapAmount">Amount (XLM)</Label>
                <Input
                  id="swapAmount"
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  placeholder="100"
                />
              </div>

              <Button 
                onClick={swapXLMtoUSDC} 
                disabled={isLoading || parseFloat(swapAmount) <= 0}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Swap {swapAmount} XLM to USDC
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SEP-24 Withdrawal */}
        {wallet.connected && parseFloat(getBalance('USDC')) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>💸 SEP-24 Withdrawal</CardTitle>
              <CardDescription>
                Withdraw USDC to your bank account via Stellar anchor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="withdrawAmount">Amount (USDC)</Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="10"
                  max={getBalance('USDC')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {getBalance('USDC')} USDC
                </p>
              </div>

              {/* Show withdrawal status if in progress */}
              {transactionId && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">Withdrawal in progress</p>
                      <p className="text-xs">Transaction ID: {transactionId}</p>
                      {withdrawalStatus && (
                        <p className="text-xs font-mono">
                          Current Status: <span className="font-bold">{withdrawalStatus}</span>
                        </p>
                      )}
                      {autoPolling && (
                        <p className="text-xs text-green-600">
                          ⚡ Auto-refreshing every 5 seconds...
                        </p>
                      )}
                      {withdrawalUrl && (
                        <p className="text-xs">
                          <a 
                            href={withdrawalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                          >
                            Open KYC Form
                          </a>
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={initiateWithdrawal} 
                  disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !!transactionId}
                  className="flex-1"
                >
                  {isLoading ? 'Processing...' : '🏦 Withdraw to Bank'}
                </Button>

                {transactionId && (
                  <>
                    <Button 
                      onClick={sendUSDCToAnchor} 
                      variant="default"
                      disabled={isLoading || withdrawalStatus === 'completed'}
                      className="flex-1"
                    >
                      💸 Send USDC
                    </Button>
                    <Button 
                      onClick={checkWithdrawalStatus} 
                      variant="outline"
                      disabled={isLoading}
                    >
                      🔄 Status
                    </Button>
                    <Button 
                      onClick={() => setAutoPolling(!autoPolling)} 
                      variant={autoPolling ? "default" : "outline"}
                      size="sm"
                    >
                      {autoPolling ? '⏸️' : '▶️'}
                    </Button>
                  </>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Steps:</strong>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>Click &quot;Withdraw to Bank&quot; and complete KYC form</li>
                    <li>Click &quot;Send USDC&quot; to transfer funds to anchor</li>
                    <li>Click &quot;Status&quot; to monitor withdrawal progress</li>
                    <li>Receive fiat in your bank account</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {status && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">{status}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Last Transaction */}
        {lastTxHash && (
          <Card>
            <CardHeader>
              <CardTitle>Last Transaction</CardTitle>
              <CardDescription>
                View your most recent swap on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Transaction Hash</p>
                  <p className="font-mono text-xs break-all">{lastTxHash}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`, '_blank')}
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Stellar Expert
                  </Button>
                  
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(lastTxHash);
                      toast.success('Transaction hash copied!');
                    }}
                    variant="outline"
                  >
                    Copy Hash
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href={`https://stellar.expert/explorer/testnet/account/${wallet.publicKey || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              View Account on Stellar Expert
              <ExternalLink className="h-3 w-3" />
            </a>
            <a 
              href="https://laboratory.stellar.org/#?network=test"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Stellar Laboratory (Testnet)
              <ExternalLink className="h-3 w-3" />
            </a>
            <a 
              href="https://testanchor.stellar.org/.well-known/stellar.toml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Anchor stellar.toml
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
