/**
 * Recent Contracts Storage
 * Manages localStorage for recently loaded contracts
 */

export interface RecentContract {
  id: string;
  address: string;
  name: string;
  chainId: number;
  isVerified: boolean;
  loadedAt: number;
}

const STORAGE_KEY = 'forgebase-recent-contracts';
const MAX_RECENT_CONTRACTS = 10;

/**
 * Get all recent contracts from localStorage
 */
export function getRecentContracts(): RecentContract[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Add a contract to recent list
 * Removes duplicates and keeps only the most recent MAX_RECENT_CONTRACTS
 */
export function addRecentContract(
  contract: Omit<RecentContract, 'id' | 'loadedAt'>
): RecentContract {
  const contracts = getRecentContracts();
  
  // Remove existing entry with same address and chainId
  const filtered = contracts.filter(
    (c) => !(c.address.toLowerCase() === contract.address.toLowerCase() && c.chainId === contract.chainId)
  );
  
  const newContract: RecentContract = {
    ...contract,
    id: crypto.randomUUID(),
    loadedAt: Date.now(),
  };
  
  // Add to beginning and limit to MAX_RECENT_CONTRACTS
  filtered.unshift(newContract);
  const limited = filtered.slice(0, MAX_RECENT_CONTRACTS);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  return newContract;
}

/**
 * Remove a contract from recent list
 */
export function removeRecentContract(id: string): void {
  const contracts = getRecentContracts().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
}

/**
 * Clear all recent contracts
 */
export function clearRecentContracts(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get recent contracts for a specific chain
 */
export function getRecentContractsByChain(chainId: number): RecentContract[] {
  return getRecentContracts().filter((c) => c.chainId === chainId);
}
