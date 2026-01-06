/**
 * Transaction Decoder Component
 * Example component showing how to use the API hooks for transaction decoding
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApi } from '@/contexts/ApiContext';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export function TransactionDecoder() {
  const [txHash, setTxHash] = useState('');
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const { useDecodeTransaction } = useApi();

  const {
    data: transaction,
    isLoading,
    error,
    refetch,
  } = useDecodeTransaction(
    { txHash, network },
    { enabled: false } // Don't auto-fetch, wait for button click
  );

  const handleDecode = () => {
    if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      toast.error('Invalid transaction hash');
      return;
    }
    refetch();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Transaction Decoder</h3>
      
      <div className="flex gap-2">
        <Input
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x..."
          className="flex-1"
        />
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'testnet')}
          className="px-3 py-2 border rounded-md"
        >
          <option value="mainnet">Mainnet</option>
          <option value="testnet">Testnet</option>
        </select>
        <Button onClick={handleDecode} disabled={isLoading || !txHash}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Decode
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
          {error.message}
        </div>
      )}

      {transaction && (
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Status:</span> {transaction.status}
            </div>
            <div>
              <span className="font-medium">Block:</span> {transaction.blockNumber}
            </div>
            <div>
              <span className="font-medium">Gas Used:</span> {transaction.gasUsed}
            </div>
            <div>
              <span className="font-medium">From:</span>{' '}
              <span className="font-mono text-xs">{transaction.from.slice(0, 10)}...</span>
            </div>
          </div>
          {transaction.events && transaction.events.length > 0 && (
            <div>
              <span className="font-medium">Events:</span> {transaction.events.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

