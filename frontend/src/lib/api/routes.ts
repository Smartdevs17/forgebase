/**
 * API Routes
 * Centralized route definitions for all backend endpoints
 */

import { getApiBaseUrl } from './config';
import type { Network } from './config';

const BASE = getApiBaseUrl();

export const API_ROUTES = {
  // Health Check
  health: () => '/health',

  // Transactions
  transactions: {
    decode: () => `${BASE}/transactions/decode`,
    get: (txHash: string, network?: Network) => {
      const params = new URLSearchParams();
      if (network) params.append('network', network);
      const query = params.toString();
      return `${BASE}/transactions/${txHash}${query ? `?${query}` : ''}`;
    },
  },

  // Contracts
  contracts: {
    get: (address: string, network?: Network) => {
      const params = new URLSearchParams({ address });
      if (network) params.append('network', network);
      return `${BASE}/contracts?${params.toString()}`;
    },
  },

  // Events
  events: {
    decode: () => `${BASE}/events/decode`,
  },

  // Receipts
  receipts: {
    get: (txHash: string, network?: Network) => {
      const params = new URLSearchParams();
      if (network) params.append('network', network);
      const query = params.toString();
      return `${BASE}/receipts/${txHash}${query ? `?${query}` : ''}`;
    },
  },
} as const;

