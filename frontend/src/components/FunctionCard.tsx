import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParsedFunction, getPlaceholder, parseInputValue } from '@/lib/abi-utils';
import { useContract } from '@/contexts/ContractContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Play, Save, BookmarkPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FunctionCardProps {
  fn: ParsedFunction;
  onResult: (result: {
    functionName: string;
    type: 'read' | 'write';
    success: boolean;
    data?: any;
    error?: string;
    txHash?: string;
  }) => void;
  savedInputs?: Record<string, string>;
}

export function FunctionCard({ fn, onResult, savedInputs }: FunctionCardProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const { contract } = useContract();
  const { addCall } = useWorkspace();
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Initialize inputs from saved values
  useEffect(() => {
    if (savedInputs) {
      setInputs(savedInputs);
    }
  }, [savedInputs]);

  const handleInputChange = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleExecute = async () => {
    if (!contract || !publicClient) return;

    setIsExecuting(true);

    try {
      // Parse inputs
      const args = fn.inputs.map((input) => {
        const value = inputs[input.name] || '';
        return parseInputValue(value, input.type);
      });

      if (fn.type === 'read') {
        const result = await publicClient.readContract({
          address: contract.address.toLowerCase() as `0x${string}`,
          abi: contract.abi,
          functionName: fn.name,
          args,
        } as any);

        onResult({
          functionName: fn.name,
          type: 'read',
          success: true,
          data: result,
        });
        setIsExecuting(false);
      } else {
        if (!walletClient || !isConnected) {
          toast.error('Please connect your wallet to execute write functions');
          return;
        }

        const hash = await walletClient.writeContract({
          address: contract.address.toLowerCase() as `0x${string}`,
          abi: contract.abi,
          functionName: fn.name,
          args,
          chain: walletClient.chain,
          account: walletClient.account,
        } as any);

        // Show immediate success with transaction hash
        onResult({
          functionName: fn.name,
          type: 'write',
          success: true,
          txHash: hash,
        });

        toast.success('Transaction submitted!');

        // Stop executing state immediately after submission
        setIsExecuting(false);

        // Wait for confirmation in background (don't block UI)
        publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 60_000, // 60 second timeout
        }).then((receipt) => {
          if (receipt.status === 'success') {
            toast.success('Transaction confirmed!');
          } else {
            toast.error('Transaction reverted on-chain');
          }
        }).catch((receiptError) => {
          // Don't show error result since transaction was already submitted
          console.warn('Failed to get receipt:', receiptError);
          toast.warning('Transaction submitted but confirmation timed out. Check explorer for status.');
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Execution failed';
      onResult({
        functionName: fn.name,
        type: fn.type,
        success: false,
        error: message,
      });
      toast.error(message);
      setIsExecuting(false);
    }
  };

  const handleSave = () => {
    if (!contract || !saveName.trim()) return;

    addCall({
      name: saveName.trim(),
      contractAddress: contract.address,
      contractName: contract.name,
      functionName: fn.name,
      functionType: fn.type,
      inputs,
      chainId: contract.chainId,
    });

    toast.success('Function call saved to workspace');
    setSaveName('');
    setIsSaveDialogOpen(false);
  };

  const isReadyToExecute = fn.type === 'read' || isConnected;
  const hasRequiredInputs = fn.inputs.every((input) => {
    const value = inputs[input.name];
    return value !== undefined && value !== '';
  });

  return (
    <div className="glass-panel rounded-lg p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={fn.type === 'read' ? 'read' : 'write'}>
            {fn.type}
          </Badge>
          <h3 className="font-mono font-semibold text-foreground">{fn.name}</h3>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Save to workspace">
                <BookmarkPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save to Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g., Mint 100 Tokens to Bob"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!saveName.trim()}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {fn.inputs.length > 0 && (
        <div className="space-y-3">
          {fn.inputs.map((input) => (
            <div key={input.name} className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="font-medium">{input.name}</span>
                <Badge variant="outline" className="text-xs">
                  {input.type}
                </Badge>
              </label>
              <Input
                value={inputs[input.name] || ''}
                onChange={(e) => handleInputChange(input.name, e.target.value)}
                placeholder={getPlaceholder(input.type)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        {fn.outputs.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Returns:{' '}
            {fn.outputs.map((o, i) => (
              <span key={i}>
                {i > 0 && ', '}
                <span className="font-mono">{o.type}</span>
                {o.name && <span className="opacity-60"> ({o.name})</span>}
              </span>
            ))}
          </div>
        )}

        <Button
          variant={fn.type === 'read' ? 'accent' : 'default'}
          onClick={handleExecute}
          disabled={isExecuting || (!isReadyToExecute && fn.type === 'write') || (fn.inputs.length > 0 && !hasRequiredInputs)}
          className="ml-auto"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {fn.type === 'read' ? 'Call' : 'Execute'}
            </>
          )}
        </Button>
      </div>

      {fn.type === 'write' && !isConnected && (
        <p className="text-xs text-muted-foreground">
          Connect your wallet to execute write functions
        </p>
      )}
    </div>
  );
}
