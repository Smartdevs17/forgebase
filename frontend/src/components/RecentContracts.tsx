import { useState, useEffect } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { getRecentContracts, removeRecentContract, type RecentContract } from '@/lib/recent-contracts';
import { fetchContractFromExplorer } from '@/lib/explorer-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Abi } from 'viem';
import { useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

export function RecentContracts() {
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { setContract } = useContract();
  const chainId = useChainId();

  useEffect(() => {
    // Load recent contracts and filter by current chain
    const contracts = getRecentContracts().filter((c) => c.chainId === chainId);
    setRecentContracts(contracts);
  }, [chainId]);

  const handleLoadContract = async (recentContract: RecentContract) => {
    setLoadingId(recentContract.id);
    try {
      const isTestnet = recentContract.chainId === baseSepolia.id;
      const contractData = await fetchContractFromExplorer(recentContract.address, isTestnet);
      
      setContract({
        address: contractData.address,
        name: contractData.name,
        abi: contractData.abi as Abi,
        chainId: recentContract.chainId,
        isVerified: contractData.is_verified,
      });
      
      toast.success(`Loaded ${contractData.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load contract';
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = (id: string) => {
    removeRecentContract(id);
    setRecentContracts((prev) => prev.filter((c) => c.id !== id));
    toast.success('Removed from recent contracts');
  };

  if (recentContracts.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Recent Contracts</h3>
        <Badge variant="secondary">{recentContracts.length}</Badge>
      </div>

      <ScrollArea className="max-h-[200px] scrollbar-thin">
        <div className="space-y-2">
          {recentContracts.map((contract) => (
            <div
              key={contract.id}
              className="group rounded-lg border border-border bg-card/50 p-2.5 hover:bg-card transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm break-words">
                    {contract.name}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                  </p>
                </div>
                <Badge
                  variant={contract.isVerified ? 'success' : 'warning'}
                  className="shrink-0 mt-0.5 text-xs"
                >
                  {contract.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => handleLoadContract(contract)}
                  disabled={loadingId === contract.id}
                >
                  {loadingId === contract.id ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Loading...
                    </>
                  ) : (
                    'Load'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(contract.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
