import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContract } from '@/contexts/ContractContext';
import { fetchContractFromExplorer, isValidAddress } from '@/lib/explorer-api';
import { getContract } from '@/lib/api/services/contract.service';
import { addRecentContract } from '@/lib/recent-contracts';
import { Search, Upload, Loader2, FileCode2, X, History } from 'lucide-react';
import { useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'sonner';
import { Abi } from 'viem';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RecentContracts } from '@/components/RecentContracts';

export function ContractLoader() {
  const [address, setAddress] = useState('');
  const [isLoadingAbi, setIsLoadingAbi] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chainId = useChainId();
  const { contract, setContract, clearContract, isLoading, error, setError, setLoading } = useContract();

  const isTestnet = chainId === baseSepolia.id;

  const handleFetchAbi = async () => {
    if (!isValidAddress(address)) {
      setError('Invalid address format. Please enter a valid Ethereum address.');
      return;
    }

    setIsLoadingAbi(true);
    setError(null);

    const network = isTestnet ? 'testnet' : 'mainnet';

    try {
      // Try backend API first
      const apiResult = await getContract(address, network);
      
      if (apiResult.success) {
        setContract({
          address: apiResult.data.address,
          name: apiResult.data.name,
          abi: apiResult.data.abi as Abi,
          chainId,
          isVerified: apiResult.data.isVerified,
        });
        
        // Save to recent contracts
        addRecentContract({
          address: apiResult.data.address,
          name: apiResult.data.name,
          chainId,
          isVerified: apiResult.data.isVerified,
        });
        
        toast.success(`Loaded ${apiResult.data.name} (via API)`);
        return;
      }
    } catch (apiError) {
      // Fall back to explorer API if backend fails
      console.warn('Backend API failed, falling back to explorer:', apiError);
    }

    // Fallback to explorer API
    try {
      const contractData = await fetchContractFromExplorer(address, isTestnet);
      setContract({
        address: contractData.address,
        name: contractData.name,
        abi: contractData.abi as Abi,
        chainId,
        isVerified: contractData.is_verified,
        isRecovered: contractData.is_verified === false
      });
      
      // Save to recent contracts
      addRecentContract({
        address: contractData.address,
        name: contractData.name,
        chainId,
        isVerified: contractData.is_verified,
      });
      
      toast.success(`Loaded ${contractData.name} (via Explorer)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contract';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoadingAbi(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Handle both raw ABI array and ABI wrapper objects
        const abi = Array.isArray(parsed) ? parsed : parsed.abi;
        
        if (!Array.isArray(abi)) {
          throw new Error('Invalid ABI format');
        }

        if (!isValidAddress(address)) {
          setError('Please enter a valid contract address first');
          return;
        }

        setContract({
          address,
          name: parsed.contractName || 'Custom Contract',
          abi: abi as Abi,
          chainId,
          isVerified: false,
        });
        toast.success('ABI loaded successfully');
      } catch (err) {
        setError('Invalid ABI file. Please upload a valid JSON ABI.');
        toast.error('Invalid ABI file');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter contract address (0x...)"
            className="pl-10 pr-4"
            disabled={!!contract}
          />
        </div>

        <Popover open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Recent Contracts">
              <History className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-4" align="end">
             <RecentContracts onSelect={() => setIsHistoryOpen(false)} />
          </PopoverContent>
        </Popover>

        {!contract ? (
          <>
            <Button
              onClick={handleFetchAbi}
              disabled={isLoadingAbi || !address}
              className="min-w-[120px]"
            >
              {isLoadingAbi ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FileCode2 className="h-4 w-4" />
                  Fetch ABI
                </>
              )}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!address}
            >
              <Upload className="h-4 w-4" />
              Upload ABI
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              clearContract();
              setAddress('');
              setIsLoadingAbi(false);
              setError(null);
            }}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {contract && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center gap-3">
            <Badge variant={contract.isVerified ? 'success' : (contract.isRecovered ? 'warning' : 'destructive')}>
              {contract.isVerified ? 'Verified' : (contract.isRecovered ? 'Recovered' : 'Unverified')}
            </Badge>
            <span className="font-medium">{contract.name}</span>
            <span className="font-mono text-sm text-muted-foreground">
              {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
            </span>
            <Badge variant="secondary">
              {contract.functions.length} functions
            </Badge>
          </div>
          
          {contract.isRecovered && (
             <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
               ⚠️ <strong>Contract not verified.</strong> Callable methods were recovered via bytecode analysis. 
               Function names and types may be inferred.
               <br/>
               <span className="opacity-80">You can upload the original ABI manually if you have it.</span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
