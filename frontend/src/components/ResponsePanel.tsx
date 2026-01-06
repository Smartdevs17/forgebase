import { useState } from 'react';
import { formatValue } from '@/lib/abi-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ExternalLink, Copy, Trash2, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { useContract } from '@/contexts/ContractContext';
import { baseSepolia } from 'wagmi/chains';

interface ExecutionResult {
  id: string;
  functionName: string;
  type: 'read' | 'write';
  success: boolean;
  data?: any;
  error?: string;
  txHash?: string;
  timestamp: number;
}

interface ResponsePanelProps {
  results: ExecutionResult[];
  onClear: () => void;
}

export function ResponsePanel({ results, onClear }: ResponsePanelProps) {
  const { contract } = useContract();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getExplorerUrl = (txHash: string) => {
    const isTestnet = contract?.chainId === baseSepolia.id;
    const baseUrl = isTestnet 
      ? 'https://sepolia.basescan.org'
      : 'https://basescan.org';
    return `${baseUrl}/tx/${txHash}`;
  };

  if (results.length === 0) {
    return (
      <div className="glass-panel rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
        <Terminal className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          Response Panel
        </h3>
        <p className="text-xs text-muted-foreground/70">
          Execute a function to see results here
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Responses</h3>
          <Badge variant="secondary">{results.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-0">
        <div className="p-4 space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="rounded-lg border border-border bg-background/50 overflow-hidden animate-fade-in"
            >
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-mono text-sm font-medium">
                    {result.functionName}
                  </span>
                  <Badge variant={result.type === 'read' ? 'read' : 'write'}>
                    {result.type}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="p-3">
                {result.success ? (
                  <div className="space-y-2">
                    {result.txHash && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">TX:</span>
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(result.txHash!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <a
                          href={getExplorerUrl(result.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      </div>
                    )}

                    {result.data !== undefined && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Result:</span>
                        <pre className="font-mono text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                          {formatValue(result.data, 'unknown')}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                    {result.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
