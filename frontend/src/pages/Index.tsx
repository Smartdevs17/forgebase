import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { ContractProvider } from '@/contexts/ContractContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { ApiProvider } from '@/contexts/ApiContext';
import { WalletConnect } from '@/components/WalletConnect';
import { ContractLoader } from '@/components/ContractLoader';
import { RecentContracts } from '@/components/RecentContracts';
import { FunctionList } from '@/components/FunctionList';
import { ResponsePanel } from '@/components/ResponsePanel';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { Toaster } from '@/components/ui/sonner';
import { Code2, Zap } from 'lucide-react';

const queryClient = new QueryClient();

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

function AppContent() {
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<{
    functionName: string;
    inputs: Record<string, string>;
  } | null>(null);

  const handleResult = (result: Omit<ExecutionResult, 'id' | 'timestamp'>) => {
    setResults((prev) => [
      {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleClearResults = () => {
    setResults([]);
  };

  const handleSelectCall = (call: { functionName: string; inputs: Record<string, string> }) => {
    setSelectedFunction({
      functionName: call.functionName,
      inputs: call.inputs,
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md z-50">
        <div className="container max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span className="gradient-text">ForgeBase</span>
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Smart Contract Workbench
              </p>
            </div>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Workspace Sidebar */}
        <aside className="w-72 border-r border-border bg-sidebar hidden lg:block">
          <WorkspaceSidebar onSelectCall={handleSelectCall} />
        </aside>

        {/* Center Content */}
        <div className="flex-1 flex flex-col">
          {/* Contract Loader */}
          <div className="border-b border-border bg-card/30 p-4 space-y-4">
            <ContractLoader />
            <RecentContracts />
          </div>

          {/* Functions & Response Split */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-0 min-h-0">
            {/* Function List */}
            <div className="border-r border-border p-4 flex flex-col min-h-0">
              <FunctionList
                onResult={handleResult}
                selectedFunction={
                  selectedFunction
                    ? {
                        name: selectedFunction.functionName,
                        inputs: selectedFunction.inputs,
                      }
                    : null
                }
              />
            </div>

            {/* Response Panel */}
            <div className="p-4 bg-muted/10 flex flex-col min-h-0">
              <ResponsePanel results={results} onClear={handleClearResults} />
            </div>
          </div>
        </div>
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}

const Index = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <ContractProvider>
            <WorkspaceProvider>
              <AppContent />
            </WorkspaceProvider>
          </ContractProvider>
        </ApiProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Index;
