import { useState, useEffect } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { getRecentContracts, removeRecentContract, type RecentContract } from '@/lib/recent-contracts';
import { fetchContractFromExplorer } from '@/lib/explorer-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Clock, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Abi } from 'viem';
import { useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

interface RecentContractsProps {
  onSelect?: () => void;
}

export function RecentContracts({ onSelect }: RecentContractsProps) {
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
        isRecovered: contractData.is_verified === false // Heuristic based on verification status
      });
      
      toast.success(`Loaded ${contractData.name}`);
      if (onSelect) onSelect();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load contract';
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentContract(id);
    setRecentContracts((prev) => prev.filter((c) => c.id !== id));
    toast.success('Removed from recent contracts');
  };

  if (recentContracts.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No recent contracts for this network.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-sm">Recent Contracts</h3>
        <Badge variant="secondary">{recentContracts.length}</Badge>
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
        <div className="space-y-2">
          {recentContracts.map((contract) => (
            <div
              key={contract.id}
              className="group rounded-lg border border-border bg-card/50 p-2.5 hover:bg-card transition-colors cursor-pointer relative"
              onClick={() => handleLoadContract(contract)}
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
                {loadingId === contract.id && (
                   <Loader2 className="h-3 w-3 animate-spin text-primary mt-1" />
                )}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                 <Badge
                  variant={contract.isVerified ? 'success' : 'warning'}
                  className="text-[10px] px-1.5 py-0 h-5"
                >
                  {contract.isVerified ? 'Verified' : 'Unverified'}
                </Badge>

                 <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRemove(contract.id, e)}
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
