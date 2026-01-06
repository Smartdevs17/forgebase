/**
 * API Context
 * State management for API calls using React Query
 */

import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { isApiError } from '@/lib/api/client';
import {
  decodeTransaction,
  getTransaction,
  type DecodedTransaction,
  type DecodeTransactionRequest,
} from '@/lib/api/services/transaction.service';
import {
  getContract,
  type ContractInfo,
} from '@/lib/api/services/contract.service';
import {
  decodeEvents,
  type DecodedEvent,
  type DecodeEventsRequest,
} from '@/lib/api/services/event.service';
import {
  getReceipt,
  type TransactionReceipt,
} from '@/lib/api/services/receipt.service';
import type { Network } from '@/lib/api/config';

interface ApiContextType {
  // Transaction queries
  useDecodeTransaction: (
    request: DecodeTransactionRequest,
    options?: { enabled?: boolean }
  ) => UseQueryResult<DecodedTransaction, Error>;
  useGetTransaction: (
    txHash: string,
    network?: Network,
    options?: { enabled?: boolean }
  ) => UseQueryResult<DecodedTransaction, Error>;

  // Contract queries
  useGetContract: (
    address: string,
    network?: Network,
    options?: { enabled?: boolean }
  ) => UseQueryResult<ContractInfo, Error>;

  // Event mutations
  useDecodeEvents: () => UseMutationResult<DecodedEvent[], Error, DecodeEventsRequest>;

  // Receipt queries
  useGetReceipt: (
    txHash: string,
    network?: Network,
    options?: { enabled?: boolean }
  ) => UseQueryResult<TransactionReceipt, Error>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  // Transaction: Decode
  const useDecodeTransaction = (
    request: DecodeTransactionRequest,
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: ['transaction', 'decode', request.txHash, request.network],
      queryFn: async () => {
        const result = await decodeTransaction(request);
        if (isApiError(result)) {
          throw new Error(result.error);
        }
        return result.data;
      },
      enabled: options?.enabled !== false && !!request.txHash,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Transaction: Get
  const useGetTransaction = (
    txHash: string,
    network?: Network,
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: ['transaction', 'get', txHash, network],
      queryFn: async () => {
        const result = await getTransaction(txHash, network);
        if (isApiError(result)) {
          throw new Error(result.error);
        }
        return result.data;
      },
      enabled: options?.enabled !== false && !!txHash,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Contract: Get
  const useGetContract = (
    address: string,
    network?: Network,
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: ['contract', address, network],
      queryFn: async () => {
        const result = await getContract(address, network);
        if (isApiError(result)) {
          throw new Error(result.error);
        }
        return result.data;
      },
      enabled: options?.enabled !== false && !!address,
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutes (contracts don't change often)
    });
  };

  // Events: Decode (mutation because it's a POST with body)
  const useDecodeEvents = () => {
    return useMutation({
      mutationFn: async (request: DecodeEventsRequest) => {
        const result = await decodeEvents(request);
        if (isApiError(result)) {
          throw new Error(result.error);
        }
        return result.data;
      },
    });
  };

  // Receipt: Get
  const useGetReceipt = (
    txHash: string,
    network?: Network,
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: ['receipt', txHash, network],
      queryFn: async () => {
        const result = await getReceipt(txHash, network);
        if (isApiError(result)) {
          throw new Error(result.error);
        }
        return result.data;
      },
      enabled: options?.enabled !== false && !!txHash,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return (
    <ApiContext.Provider
      value={{
        useDecodeTransaction,
        useGetTransaction,
        useGetContract,
        useDecodeEvents,
        useGetReceipt,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

