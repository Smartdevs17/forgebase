/**
 * Transaction Service
 * Repository for transaction-related API calls
 */

import { apiGet, apiPost, type ApiResult } from '../client';
import { API_ROUTES } from '../routes';
import type { Network } from '../config';

export interface DecodedTransaction {
  txHash: string;
  status: 'success' | 'failed';
  blockNumber: string;
  timestamp: string;
  gasUsed: string;
  gasPrice: string;
  from: string;
  to: string;
  value: string;
  callTrace: any;
  events: any[];
  stateChanges: any[];
}

export interface DecodeTransactionRequest {
  txHash: string;
  network?: Network;
}

/**
 * Decode a transaction hash
 */
export async function decodeTransaction(
  request: DecodeTransactionRequest
): Promise<ApiResult<DecodedTransaction>> {
  return apiPost<DecodedTransaction>(API_ROUTES.transactions.decode(), {
    txHash: request.txHash,
    network: request.network || 'mainnet',
  });
}

/**
 * Get transaction by hash
 */
export async function getTransaction(
  txHash: string,
  network?: Network
): Promise<ApiResult<DecodedTransaction>> {
  return apiGet<DecodedTransaction>(
    API_ROUTES.transactions.get(txHash, network)
  );
}

