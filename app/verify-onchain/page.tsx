'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Copy,
  FileSearch,
  Wallet,
  Receipt,
  Lock
} from 'lucide-react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkConfig } from '@/lib/stellar/config';
import { toast } from 'sonner';

interface TransactionDetails {
  hash: string;
  source: string;
  fee: string;
  operationCount: number;
  createdAt: string;
  successful: boolean;
  ledger: number;
  operations: any[];
}

interface AccountInfo {
  id: string;
  sequence: string;
  balances: any[];
  signers: any[];
  data: Record<string, string>;
}

export default function VerifyOnChainPage() {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [accountId, setAccountId] = useState('');
  const [escrowId, setEscrowId] = useState('');
  const [txDetails, setTxDetails] = useState<TransactionDetails | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = getNetworkConfig();
  const server = new StellarSdk.Horizon.Server(config.horizonUrl);
  const networkType = config.network === 'TESTNET' ? 'testnet' : 'public';

  // Auto-load transaction from localStorage on mount
  useEffect(() => {
    const lastTxHash = localStorage.getItem('lastTransactionHash');
    const storedPublicKey = localStorage.getItem('walletPublicKey');
    
    if (lastTxHash) {
      console.log('🔄 Auto-loading transaction:', lastTxHash);
      setTxHash(lastTxHash);
      // Auto-verify the transaction
      setTimeout(() => {
        verifyTransactionByHash(lastTxHash);
      }, 500);
      // Clear it after loading
      localStorage.removeItem('lastTransactionHash');
    }
    
    if (storedPublicKey && !accountId) {
      setAccountId(storedPublicKey);
    }
  }, []);

  // Get links for different explorers
  const getStellarExpertLink = (type: 'tx' | 'account' | 'ledger', value: string) => {
    return `https://stellar.expert/explorer/${networkType}/${type}/${value}`;
  };

  const getStellarLabLink = (type: 'tx' | 'account', value: string) => {
    const network = networkType === 'testnet' ? 'testnet' : 'public';
    if (type === 'tx') {
      return `https://laboratory.stellar.org/#explorer?resource=transactions&endpoint=single&network=${network}&values=${encodeURIComponent(JSON.stringify({ transaction: value }))}`;
    }
    return `https://laboratory.stellar.org/#explorer?resource=accounts&endpoint=single&network=${network}&values=${encodeURIComponent(JSON.stringify({ account_id: value }))}`;
  };

  const getStellarChainLink = (type: 'tx' | 'account', value: string) => {
    return `https://stellarchain.io/${networkType}/${type === 'tx' ? 'tx' : 'address'}/${value}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const verifyTransactionByHash = async (hash: string) => {
    setLoading(true);
    setError(null);
    setTxDetails(null);

    try {
      console.log('🔍 Fetching transaction from blockchain:', hash);
      console.log('🌐 Horizon URL:', server.serverURL.toString());
      console.log('📡 Network:', networkType);
      
      toast.info('Searching blockchain...', {
        description: `Looking for transaction: ${hash.slice(0, 12)}...`
      });
      
      const transaction = await server.transactions().transaction(hash).call();
      
      console.log('✅ Transaction found on-chain:', transaction);

      // Fetch operations for this transaction
      const operationsResponse = await server.operations().forTransaction(hash).call();

      const details: TransactionDetails = {
        hash: transaction.hash,
        source: transaction.source_account,
        fee: String(transaction.fee_charged),
        operationCount: transaction.operation_count,
        createdAt: transaction.created_at,
        successful: transaction.successful,
        ledger: Number(transaction.ledger_attr) || 0,
        operations: operationsResponse.records,
      };

      setTxDetails(details);
      
      toast.success('✅ Transaction Verified!', {
        description: `Found on ledger ${details.ledger}`,
      });

    } catch (err: any) {
      console.error('❌ Error verifying transaction:', err);
      console.error('❌ Full error object:', JSON.stringify(err, null, 2));
      
      const errorMsg = err.message || 'Transaction not found on blockchain';
      setError(errorMsg);
      
      toast.error('Transaction not found', {
        description: 'This transaction does not exist on the Stellar network. The transaction may have failed or was never submitted.',
        duration: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTransaction = async () => {
    if (!txHash.trim()) {
      setError('Please enter a transaction hash');
      return;
    }

    await verifyTransactionByHash(txHash);
  };

  const verifyAccount = async (accountIdToVerify?: string) => {
    const idToUse = accountIdToVerify || accountId;
    
    if (!idToUse.trim()) {
      setError('Please enter an account ID or connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setAccountInfo(null);

    try {
      console.log('🔍 Fetching account from blockchain:', idToUse);
      
      const account = await server.loadAccount(idToUse);
      
      console.log('✅ Account found on-chain:', account);

      const info: AccountInfo = {
        id: account.accountId(),
        sequence: account.sequence,
        balances: account.balances,
        signers: account.signers,
        data: {},
      };

      // Get account data entries (used for escrow info)
      const accountData = await server.accounts().accountId(idToUse).call();
      info.data = accountData.data_attr || {};

      setAccountInfo(info);
      console.log('📊 Account details:', info);
      
      toast.success('Account verified on-chain!');
    } catch (err: any) {
      console.error('❌ Error fetching account:', err);
      setError(err.message || 'Failed to fetch account. Please check the account ID and try again.');
      toast.error('Account not found on-chain');
    } finally {
      setLoading(false);
    }
  };

  const verifyEscrow = async () => {
    if (!escrowId.trim()) {
      setError('Please enter an escrow ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Verifying escrow on-chain:', escrowId);
      
      // Check if escrow exists in localStorage
      const storedProjects = localStorage.getItem('projects');
      const projects = storedProjects ? JSON.parse(storedProjects) : [];
      const project = projects.find((p: any) => p.escrowId === escrowId);

      if (project) {
        console.log('📦 Found escrow in localStorage:', project);
        
        // If there's a transaction hash, verify it on-chain
        if (project.txHash) {
          console.log('🔗 Verifying associated transaction:', project.txHash);
          setTxHash(project.txHash);
          await verifyTransaction();
        }

        // If there's a creator address, verify the account
        if (project.creator) {
          console.log('👤 Verifying creator account:', project.creator);
          setAccountId(project.creator);
          await verifyAccount(project.creator);
        }

        toast.success('Escrow found and verified!');
      } else {
        setError('Escrow not found in local storage. It may not have been created yet.');
        toast.warning('Escrow not found locally');
      }
    } catch (err: any) {
      console.error('❌ Error verifying escrow:', err);
      setError(err.message || 'Failed to verify escrow');
      toast.error('Escrow verification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: string, decimals: number = 7) => {
    return parseFloat(amount).toFixed(decimals);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🔍 On-Chain Verification</h1>
        <p className="text-muted-foreground text-lg">
          Verify transactions, accounts, and escrows directly on the Stellar blockchain
        </p>
      </div>

      {/* Wallet Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wallet.connected ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Account:</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {wallet.publicKey?.slice(0, 8)}...{wallet.publicKey?.slice(-8)}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(wallet.publicKey!, 'Account ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => verifyAccount(wallet.publicKey!)}
                  disabled={loading}
                >
                  Verify My Account
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href={getStellarExpertLink('account', wallet.publicKey!)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Stellar Expert
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href={getStellarLabLink('account', wallet.publicKey!)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Stellar Laboratory
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">Connect your wallet to verify your account</p>
              <Button onClick={() => wallet.connect()}>
                Connect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="transaction" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transaction">
            <Receipt className="h-4 w-4 mr-2" />
            Transaction
          </TabsTrigger>
          <TabsTrigger value="account">
            <Wallet className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="escrow">
            <Lock className="h-4 w-4 mr-2" />
            Escrow
          </TabsTrigger>
        </TabsList>

        {/* Transaction Verification */}
        <TabsContent value="transaction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verify Transaction</CardTitle>
              <CardDescription>
                Enter a transaction hash to verify it on the Stellar blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash</Label>
                <div className="flex gap-2">
                  <Input
                    id="txHash"
                    placeholder="e.g., 3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyTransaction()}
                  />
                  <Button onClick={verifyTransaction} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {txDetails && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Transaction Details</h3>
                    <Badge variant={txDetails.successful ? "default" : "destructive"}>
                      {txDetails.successful ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Success</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                      )}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hash</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                          {txDetails.hash}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(txDetails.hash, 'Transaction hash')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Source Account</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                          {txDetails.source}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(txDetails.source, 'Source account')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Fee</p>
                      <p className="font-mono">{txDetails.fee} stroops</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Operations</p>
                      <p className="font-mono">{txDetails.operationCount}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Ledger</p>
                      <p className="font-mono">{txDetails.ledger}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Created At</p>
                      <p className="text-sm">{formatDate(txDetails.createdAt)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Operations ({txDetails.operations.length})</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {txDetails.operations.map((op: any, index: number) => (
                        <div key={index} className="bg-muted p-3 rounded text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{op.type}</span>
                            <Badge variant="outline">{index + 1}</Badge>
                          </div>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(op, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <a 
                      href={getStellarExpertLink('tx', txDetails.hash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Stellar Expert
                      </Button>
                    </a>
                    <a 
                      href={getStellarLabLink('tx', txDetails.hash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Stellar Laboratory
                      </Button>
                    </a>
                    <a 
                      href={getStellarChainLink('tx', txDetails.hash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on StellarChain
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Verification */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verify Account</CardTitle>
              <CardDescription>
                Enter an account ID to verify it on the Stellar blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountId">Account ID (Public Key)</Label>
                <div className="flex gap-2">
                  <Input
                    id="accountId"
                    placeholder="e.g., GBME2G...Q2NTDH"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyAccount()}
                  />
                  <Button onClick={() => verifyAccount()} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {accountInfo && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Account Details</h3>
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Account ID</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                          {accountInfo.id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(accountInfo.id, 'Account ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Sequence Number</p>
                      <p className="font-mono text-sm">{accountInfo.sequence}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Balances</p>
                      <div className="space-y-2">
                        {accountInfo.balances.map((balance: any, index: number) => (
                          <div key={index} className="bg-muted p-3 rounded">
                            {balance.asset_type === 'native' ? (
                              <div className="flex justify-between items-center">
                                <span className="font-semibold">XLM (Native)</span>
                                <span className="font-mono">{formatAmount(balance.balance)} XLM</span>
                              </div>
                            ) : (
                              <div>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold">{balance.asset_code}</span>
                                  <span className="font-mono">{formatAmount(balance.balance)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Issuer: {balance.asset_issuer?.slice(0, 8)}...{balance.asset_issuer?.slice(-8)}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {accountInfo.signers.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Signers</p>
                        <div className="space-y-2">
                          {accountInfo.signers.map((signer: any, index: number) => (
                            <div key={index} className="bg-muted p-3 rounded text-sm">
                              <div className="flex justify-between items-center">
                                <code className="text-xs">{signer.key}</code>
                                <Badge variant="outline">Weight: {signer.weight}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.keys(accountInfo.data).length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Data Entries</p>
                        <div className="bg-muted p-3 rounded">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(accountInfo.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <a 
                      href={getStellarExpertLink('account', accountInfo.id)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Stellar Expert
                      </Button>
                    </a>
                    <a 
                      href={getStellarLabLink('account', accountInfo.id)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Stellar Laboratory
                      </Button>
                    </a>
                    <a 
                      href={getStellarChainLink('account', accountInfo.id)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on StellarChain
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escrow Verification */}
        <TabsContent value="escrow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verify Escrow</CardTitle>
              <CardDescription>
                Enter an escrow ID to verify its on-chain status and associated transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="escrowId">Escrow ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="escrowId"
                    placeholder="e.g., ESCROW_1234567890_abc123"
                    value={escrowId}
                    onChange={(e) => setEscrowId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyEscrow()}
                  />
                  <Button onClick={verifyEscrow} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <FileSearch className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                  This will search for the escrow in local storage and verify any associated on-chain transactions and accounts.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
