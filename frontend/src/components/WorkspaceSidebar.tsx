import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useContract } from '@/contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bookmark, Trash2, Play, FolderOpen } from 'lucide-react';
import { fetchContractFromExplorer } from '@/lib/explorer-api';
import { toast } from 'sonner';
import { Abi } from 'viem';
import { baseSepolia } from 'wagmi/chains';

interface WorkspaceSidebarProps {
  onSelectCall: (call: {
    functionName: string;
    inputs: Record<string, string>;
  }) => void;
}

export function WorkspaceSidebar({ onSelectCall }: WorkspaceSidebarProps) {
  const { savedCalls, removeCall } = useWorkspace();
  const { contract, setContract } = useContract();

  const handleLoadCall = async (call: typeof savedCalls[0]) => {
    // If contract isn't loaded or different, load it first
    if (!contract || contract.address.toLowerCase() !== call.contractAddress.toLowerCase()) {
      try {
        const isTestnet = call.chainId === baseSepolia.id;
        const contractData = await fetchContractFromExplorer(call.contractAddress, isTestnet);
        setContract({
          address: contractData.address,
          name: contractData.name,
          abi: contractData.abi as Abi,
          chainId: call.chainId,
          isVerified: contractData.is_verified,
        });
      } catch (err) {
        toast.error('Failed to load contract. The contract may need to be loaded manually.');
        return;
      }
    }

    onSelectCall({
      functionName: call.functionName,
      inputs: call.inputs,
    });

    toast.success(`Loaded: ${call.name}`);
  };

  if (savedCalls.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Bookmark className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Workspace</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            No Saved Calls
          </h3>
          <p className="text-xs text-muted-foreground/70">
            Save function calls for quick access later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Bookmark className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Workspace</h2>
        <Badge variant="secondary">{savedCalls.length}</Badge>
      </div>

      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-3 space-y-2">
          {savedCalls.map((call) => (
            <div
              key={call.id}
              className="group rounded-lg border border-border bg-card/50 p-3 hover:bg-card transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm break-words" title={call.name}>
                    {call.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {call.contractName}.{call.functionName}()
                  </p>
                </div>
                <Badge
                  variant={call.functionType === 'read' ? 'read' : 'write'}
                  className="shrink-0 mt-0.5"
                >
                  {call.functionType}
                </Badge>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleLoadCall(call)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Load
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeCall(call.id)}
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
