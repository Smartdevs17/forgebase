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
    // Try Basescan first
    // Note: frontend request usually goes through backend proxy for keys, but if calling directly:
    const response = await fetch(`${baseUrl}?module=contract&action=getabi&address=${address}`);
    
    // Check for API errors (e.g. V1 deprecated, Not Verified) or non-OK response
    let data;
    try {
        data = await response.json();
    } catch (e) {
        // failed to parse json, probably not what we want
        throw new Error('Basescan response invalid');
    }

    if (response.ok && data.status === '1' && data.result) {
       // Basescan success
       let abi: any[];
       try {
         abi = JSON.parse(data.result);
         
         // Try to get contract name
         let contractName = 'Unknown Contract';
         try {
           const sourceResponse = await fetch(`${baseUrl}?module=contract&action=getsourcecode&address=${address}`);
           if (sourceResponse.ok) {
             const sourceData = await sourceResponse.json();
             if (sourceData.status === '1' && sourceData.result && sourceData.result.length > 0) {
               contractName = sourceData.result[0].ContractName || 'Unknown Contract';
             }
           }
         } catch (err) {
           console.warn('Failed to fetch contract name:', err);
         }
         
         return {
           address: address,
           name: contractName,
           abi: abi,
           is_verified: true,
         };
       } catch (e) {
         // Fall through to fallback
         console.warn('Basescan parse error, falling back:', e);
       }
    }

    throw new Error(data?.result || 'Basescan fetch failed');

  } catch (error) {
    // Fallback to Blockscout
    try {
        const blockscoutUrl = isTestnet 
            ? 'https://base-sepolia.blockscout.com/api' 
            : 'https://base.blockscout.com/api';
            
        const bsResponse = await fetch(`${blockscoutUrl}?module=contract&action=getabi&address=${address}`);
        const bsData = await bsResponse.json();
        
        if (bsResponse.ok && bsData.status === '1' && bsData.result) {
             return {
                 address: address,
                 name: 'Unknown Contract (Blockscout)',
                 abi: JSON.parse(bsData.result),
                 is_verified: true
             };
        }
    } catch(bsError) {
        console.warn('Blockscout fallback failed:', bsError);
    }

    if (error instanceof Error) {
        // console.error(error);
    }
    throw new Error('Failed to fetch contract from explorer (Basescan & Blockscout checked)');
  }
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
