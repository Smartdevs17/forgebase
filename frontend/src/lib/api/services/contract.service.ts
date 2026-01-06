/**
 * Contract Service
 * Repository for contract-related API calls
 */

import { apiGet, type ApiResult } from '../client';
import { API_ROUTES } from '../routes';
import type { Network } from '../config';

export interface ContractInfo {
  address: string;
  name: string;
  abi: any[];
  isVerified: boolean;
}

/**
 * Get contract information and ABI from backend
 * Falls back to explorer API if backend fails
 */
export async function getContract(
  address: string,
  network?: Network
): Promise<ApiResult<ContractInfo>> {
  return apiGet<ContractInfo>(API_ROUTES.contracts.get(address, network));
}

