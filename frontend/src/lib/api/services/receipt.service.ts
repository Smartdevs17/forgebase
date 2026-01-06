/**
 * Receipt Service
 * Repository for transaction receipt API calls
 */

import { apiGet, type ApiResult } from '../client';
import { API_ROUTES } from '../routes';
import type { Network } from '../config';
import type { DecodedEvent } from './event.service';

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: string;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string | null;
  gasUsed: string;
  effectiveGasPrice: string;
  status: 'success' | 'failed';
  timestamp: string;
  events: DecodedEvent[];
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
  }>;
}

/**
 * Get transaction receipt with decoded events
 */
export async function getReceipt(
  txHash: string,
  network?: Network
): Promise<ApiResult<TransactionReceipt>> {
  return apiGet<TransactionReceipt>(API_ROUTES.receipts.get(txHash, network));
}

