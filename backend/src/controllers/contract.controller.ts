import { Request, Response } from 'express'
import { z } from 'zod'

// Etherscan V2 is used, so legacy Basescan API constants are removed

interface EtherscanResponse {
	status: string
	message: string
	result: any
}

interface RpcResponse {
	jsonrpc: string
	id: number
	result: string
}

interface FourByteResponse {
	count: number
	next: string | null
	previous: string | null
	results: {
		id: number
		created_at: string
		text_signature: string
		hex_signature: string
		bytes_signature: string
	}[]
}

const getContractSchema = z.object({
	address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format'),
	network: z.enum(['mainnet', 'testnet']).optional().default('mainnet'),
})

// Re-adding interface for SourceCode/Proxy check
interface EtherscanSourceCode {
	SourceCode: string
	ABI: string
	ContractName: string
	Proxy: string // "0" or "1"
	Implementation: string // Address
}

// Tier 1: Etherscan V2 API (Verified Contracts)
export const getContract = async (req: Request, res: Response): Promise<void> => {
	try {
		const { address, network } = getContractSchema.parse(req.query)
		
		// Map network to Chain ID for Etherscan V2
		const chainId = network === 'testnet' ? '84532' : '8453'

		// Attempt 1: Etherscan V2 API
		try {
			const apiKey = process.env.BASESCAN_API_KEY
			const apiKeyParam = apiKey ? `&apikey=${apiKey}` : ''
			const v2Url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getabi&address=${address}${apiKeyParam}`
			
			const response = await fetch(v2Url)
			if (!response.ok) throw new Error(`Etherscan API error: ${response.statusText}`)

			const data = (await response.json()) as EtherscanResponse

			if (data.status !== '1' || !data.result) {
				throw new Error(data.message || 'Contract not verified')
			}

			// Success - Parse Verified ABI
			let abi: any[]
			try {
				abi = JSON.parse(data.result)
			} catch (e) {
				throw new Error('Failed to parse Verified ABI')
			}

			// Fetch Contract Name & Check for Proxy
			let contractName = 'Unknown Contract'
			try {
				const sourceUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}${apiKeyParam}`
				const sourceResponse = await fetch(sourceUrl)
				if (sourceResponse.ok) {
					const sourceData = (await sourceResponse.json()) as EtherscanResponse
					if (sourceData.status === '1' && Array.isArray(sourceData.result) && sourceData.result.length > 0) {
						const result = sourceData.result[0] as EtherscanSourceCode
						contractName = result.ContractName || 'Unknown Contract'

						// Check for Proxy
						if (result.Proxy === '1' && result.Implementation) {
							console.log(`Proxy detected at ${address}, implementation at ${result.Implementation}`)
							// Fetch Implementation ABI
							const implUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getabi&address=${result.Implementation}${apiKeyParam}`
							const implRes = await fetch(implUrl)
							if (implRes.ok) {
								const implData = (await implRes.json()) as EtherscanResponse
								if (implData.status === '1' && implData.result) {
									const implAbi = JSON.parse(implData.result)
									// Union ABIs or replace? Usually replacement is what users want for interaction
									// But technically it's Proxy ABI + Implementation ABI logic.
									// For simple tools, using Implementation ABI is usually preferred to see logic functions.
									abi = implAbi
									contractName += ' (Proxy)'
								}
							}
						}
					}
				}
			} catch (err) {
				console.warn('Failed to fetch contract details/proxy:', err)
			}

			res.status(200).json({
				success: true,
				data: {
					address,
					name: contractName,
					abi,
					isVerified: true
				}
			})
			return

		} catch (tier1Error) {
			console.warn('Tier 1 (Verified) failed:', tier1Error)
			
			// Attempt 2: Selector-based Recovery (Heuristic)
			// This is critical for unverified contracts
			try {
				// 1. Get Bytecode from RPC
				// We need an RPC provider. We can use the one from rpc.service or just a quick fetch if we have the URL
				let rpcUrl = network === 'testnet' 
					? (process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
					: (process.env.BASE_RPC_URL || 'https://mainnet.base.org')
				
				// Sanitize RPC URL (remove explorers)
				if (rpcUrl.includes('basescan.org') || rpcUrl.includes('etherscan.io')) {
					rpcUrl = network === 'testnet' ? 'https://sepolia.base.org' : 'https://mainnet.base.org'
				}

				const codeResponse = await fetch(rpcUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						jsonrpc: '2.0',
						id: 1,
						method: 'eth_getCode',
						params: [address, 'latest']
					})
				})

				const codeData = (await codeResponse.json()) as RpcResponse
				const bytecode = codeData?.result

				if (!bytecode || bytecode === '0x') {
					throw new Error('No bytecode found at address')
				}

				// 2. Extract Selectors (PUSH4 0x...) logic is complex. 
				// Simple heuristic: Regex for PUSH4 instructions usually loading selectors? 
				// Or better: Just regex for 8-char hex strings is too noisy.
				// standard way: look for dispatch table comparisons `63XXXXXXXX` (PUSH4 + selector)
				// Regex: /63([0-9a-fA-F]{8})/g
				const matches = bytecode.match(/63([0-9a-fA-F]{8})/g)
				const uniqueSelectors = [...new Set(matches?.map((m: string) => '0x' + m.slice(2)) || [])]

				if (uniqueSelectors.length === 0) {
					throw new Error('No selectors found in bytecode')
				}

				// 3. Resolve Selectors via 4byte.directory
				// API: https://www.4byte.directory/api/v1/signatures/?hex_signature=0x...
				
				const recoveredAbi: any[] = []
				
				// Helper to fetch signature
				const fetchSignature = async (selector: string) => {
					try {
						const sigRes = await fetch(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`)
						if (!sigRes.ok) return null
						const sigData = (await sigRes.json()) as FourByteResponse
						if (sigData.results && sigData.results.length > 0) {
							// Take the lowest ID (oldest/most canonical usually)
							const bestSig = sigData.results.sort((a, b) => a.id - b.id)[0].text_signature
							// Convert "transfer(address,uint256)" -> ABI Object
							// Quick regex parser
							const nameMatch = bestSig.match(/^([a-zA-Z0-9_]+)\((.*)\)$/)
							if (nameMatch) {
								const name = nameMatch[1]
								const args = nameMatch[2] ? nameMatch[2].split(',') : []
								return {
									type: 'function',
									name: name,
									inputs: args.map((type: string) => ({ type: type.trim(), name: '' })), // inputs need names? empty is allowed in ABI?
									stateMutability: 'nonpayable', // heuristic
									selector: selector
								}
							}
						}
					} catch (e) {
						// ignore
					}
					// Fallback if not found: generic placeholder
					return {
						type: 'function',
						name: `unknown_${selector.slice(2)}`,
						inputs: [],
						stateMutability: 'nonpayable',
						selector: selector
					}
				}

				const promises = uniqueSelectors.map((sel: string) => fetchSignature(sel))
				const results = await Promise.all(promises)
				recoveredAbi.push(...results.filter((r: any) => r !== null))

				res.status(200).json({
					success: true,
					data: {
						address,
						name: 'Unverified Contract (Recovered)',
						abi: recoveredAbi,
						isVerified: false,
						isRecovered: true // New flag for UI
					}
				})
				return

			} catch (tier2Error) {
				console.warn('Tier 2 (Recovered) failed:', tier2Error)
				
				// Final Fallback: Return 404 with specific code
				res.status(404).json({
					success: false,
					error: 'Contract not verified and recovery failed',
					code: 'REQUIRE_MANUAL_ABI'
				})
			}
		}

	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				success: false,
				error: 'Invalid request',
				details: error.errors,
			})
			return
		}

		console.error('Error in getContract:', error)
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to get contract',
		})
	}
}
