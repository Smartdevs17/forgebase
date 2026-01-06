import { useRef, useState } from 'react';
import { FunctionCard } from './FunctionCard';
import { useContract } from '@/contexts/ContractContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Pencil, FileCode2 } from 'lucide-react';

interface FunctionListProps {
  onResult: (result: {
    functionName: string;
    type: 'read' | 'write';
    success: boolean;
    data?: any;
    error?: string;
    txHash?: string;
  }) => void;
  selectedFunction?: {
    name: string;
    inputs: Record<string, string>;
  } | null;
}

export function FunctionList({ onResult, selectedFunction }: FunctionListProps) {
  const { contract } = useContract();
  const [activeTab, setActiveTab] = useState<'read' | 'write'>('read');

  const readScrollRef = useRef<HTMLDivElement | null>(null);
  const writeScrollRef = useRef<HTMLDivElement | null>(null);

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileCode2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No Contract Loaded
        </h3>
        <p className="text-sm text-muted-foreground/70 max-w-sm">
          Enter a contract address and fetch its ABI to see available functions
        </p>
      </div>
    );
  }

  const readFunctions = contract.functions.filter((f) => f.type === 'read');
  const writeFunctions = contract.functions.filter((f) => f.type === 'write');

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        const tab = value as 'read' | 'write';
        setActiveTab(tab);
        // Reset scroll position when switching tabs so headers are visible
        if (tab === 'read' && readScrollRef.current) {
          readScrollRef.current.scrollTop = 0;
        }
        if (tab === 'write' && writeScrollRef.current) {
          writeScrollRef.current.scrollTop = 0;
        }
      }}
      className="h-full flex flex-col"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="read" className="gap-2">
          <Eye className="h-4 w-4" />
          Read ({readFunctions.length})
        </TabsTrigger>
        <TabsTrigger value="write" className="gap-2">
          <Pencil className="h-4 w-4" />
          Write ({writeFunctions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="read" className="mt-0 data-[state=active]:flex flex-col h-[500px] overflow-y-auto scrollbar-thin pb-10">
        {/* Internal scroll handled by TabsContent for fixed height */}
        <div ref={readScrollRef}>
          <div className="space-y-3 pt-2 pb-4">
            {readFunctions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No read functions found
              </p>
            ) : (
              readFunctions.map((fn) => (
                <FunctionCard
                  key={fn.name}
                  fn={fn}
                  onResult={onResult}
                  savedInputs={
                    selectedFunction?.name === fn.name
                      ? selectedFunction.inputs
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="write" className="mt-0 data-[state=active]:flex flex-col h-[500px] overflow-y-auto scrollbar-thin pb-10">
        {/* Same behavior for write functions */}
        <div ref={writeScrollRef}>
          <div className="space-y-3 pt-2 pb-4">
            {writeFunctions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No write functions found
              </p>
            ) : (
              writeFunctions.map((fn) => (
                <FunctionCard
                  key={fn.name}
                  fn={fn}
                  onResult={onResult}
                  savedInputs={
                    selectedFunction?.name === fn.name
                      ? selectedFunction.inputs
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
