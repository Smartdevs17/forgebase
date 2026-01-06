import React, { createContext, useContext, useState, useCallback } from 'react';
import { Abi } from 'viem';
import { parseAbi, ParsedFunction, ParsedEvent } from '@/lib/abi-utils';

interface ContractState {
  address: string;
  name: string;
  abi: Abi;
  functions: ParsedFunction[];
  events: ParsedEvent[];
  chainId: number;
  isVerified: boolean;
}

interface ContractContextType {
  contract: ContractState | null;
  isLoading: boolean;
  error: string | null;
  setContract: (contract: Omit<ContractState, 'functions' | 'events'>) => void;
  clearContract: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const [contract, setContractState] = useState<ContractState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setContract = useCallback((newContract: Omit<ContractState, 'functions' | 'events'>) => {
    const { functions, events } = parseAbi(newContract.abi);
    setContractState({
      ...newContract,
      functions,
      events,
    });
    setError(null);
  }, []);

  const clearContract = useCallback(() => {
    setContractState(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <ContractContext.Provider
      value={{
        contract,
        isLoading,
        error,
        setContract,
        clearContract,
        setLoading,
        setError,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}
