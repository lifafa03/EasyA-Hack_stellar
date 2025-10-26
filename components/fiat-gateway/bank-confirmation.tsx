'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Mail } from 'lucide-react';

interface BankConfirmationProps {
  amount: string;
  currency?: string;
  transactionId: string;
  anchorName: string;
  onClose: () => void;
}

export function BankConfirmation({
  amount,
  currency = 'USD',
  transactionId,
  anchorName,
  onClose,
}: BankConfirmationProps) {
  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Generate fake bank details
  const accountNumber = `****${Math.floor(1000 + Math.random() * 9000)}`;
  const routingNumber = '121000248';
  const referenceNumber = `REF${Date.now().toString().slice(-8)}`;
  
  // Initial balance and new balance calculation
  const initialBalance = 2500.00;
  const depositAmount = parseFloat(amount);
  const newBalance = initialBalance + depositAmount;

  const handleDownloadReceipt = () => {
    // Create a simple text receipt
    const receipt = `
═══════════════════════════════════════════
         DEPOSIT CONFIRMATION RECEIPT
═══════════════════════════════════════════

Date: ${formattedDate}
Time: ${formattedTime}

TRANSACTION DETAILS
─────────────────────────────────────────
Amount Deposited:     ${currency} ${amount}
Previous Balance:     ${currency} ${initialBalance.toFixed(2)}
New Balance:          ${currency} ${newBalance.toFixed(2)}
Account Number:       ${accountNumber}
Routing Number:       ${routingNumber}
Reference Number:     ${referenceNumber}

STELLAR BLOCKCHAIN DETAILS
─────────────────────────────────────────
Anchor Provider:      ${anchorName}
Transaction ID:       ${transactionId}

STATUS: COMPLETED ✓

Thank you for using our service!

═══════════════════════════════════════════
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-receipt-${referenceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full bg-white dark:bg-gray-900 overflow-hidden">
        {/* Email Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-6 w-6" />
            <h2 className="text-xl font-bold">Bank Deposit Notification</h2>
          </div>
          <p className="text-blue-100 text-sm">from: notifications@yourbank.com</p>
        </div>

        {/* Email Body */}
        <div className="p-6 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Deposit Successful!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formattedDate} at {formattedTime}
            </p>
          </div>

          {/* Amount Display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount Deposited</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {currency} ${parseFloat(amount).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Transaction Details */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            <div className="p-4 flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Account Number</span>
              <span className="font-medium text-gray-900 dark:text-white">{accountNumber}</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Routing Number</span>
              <span className="font-medium text-gray-900 dark:text-white">{routingNumber}</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Reference Number</span>
              <span className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                {referenceNumber}
              </span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Anchor Provider</span>
              <span className="font-medium text-gray-900 dark:text-white">{anchorName}</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
              <span className="font-medium text-gray-900 dark:text-white font-mono text-xs">
                {transactionId.slice(0, 8)}...{transactionId.slice(-8)}
              </span>
            </div>
          </div>

          {/* New Balance Simulation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-900 dark:text-blue-100">
                Previous Balance
              </span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                ${initialBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-900 dark:text-blue-100">
                Deposit Amount
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                + ${depositAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-900 dark:text-blue-100 font-bold">
                  New Account Balance
                </span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ${newBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              <strong>Note:</strong> This deposit was processed through Stellar blockchain
              network via {anchorName}. Funds are now available in your bank account.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              If you did not authorize this transaction, please contact customer support
              immediately.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadReceipt}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
