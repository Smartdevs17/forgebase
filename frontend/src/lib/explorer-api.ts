const BASE_EXPLORER_API = 'https://api.basescan.org/api';
const BASE_SEPOLIA_EXPLORER_API = 'https://api-sepolia.basescan.org/api';

export interface ExplorerContract {
  address: string;
  name: string;
  abi: any[];
  is_verified: boolean;
}

export async function fetchContractFromExplorer(
  address: string,
  isTestnet: boolean = false
): Promise<ExplorerContract> {
  const baseUrl = isTestnet ? BASE_SEPOLIA_EXPLORER_API : BASE_EXPLORER_API;
  
  try {
    // Fetch contract info
    const response = await fetch(`${baseUrl}/smart-contracts/${address}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Contract not found or not verified. Please upload ABI manually.');
      }
      throw new Error(`Explorer API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.abi) {
      throw new Error('Contract ABI not available. Please upload ABI manually.');
    }

    return {
      address: data.address?.hash || address,
      name: data.name || 'Unknown Contract',
      abi: data.abi,
      is_verified: data.is_verified || false,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch contract from explorer');
  }
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
