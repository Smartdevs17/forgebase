import { Request, Response } from 'express'
import { z } from 'zod'

const BASE_EXPLORER_API = 'https://api.basescan.org/api'
const BASE_SEPOLIA_EXPLORER_API = 'https://api-sepolia.basescan.org/api'

interface ExplorerContractResponse {
	address?: {
		hash?: string
	}
	name?: string
	abi?: any[]
	is_verified?: boolean
}

const getContractSchema = z.object({
	address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format'),
	network: z.enum(['mainnet', 'testnet']).optional().default('mainnet'),
})

export const getContract = async (req: Request, res: Response): Promise<void> => {
	try {
		const { address, network } = getContractSchema.parse(req.query)

		const baseUrl = network === 'testnet' ? BASE_SEPOLIA_EXPLORER_API : BASE_EXPLORER_API

		try {
			const response = await fetch(`${baseUrl}/smart-contracts/${address}`)

			if (!response.ok) {
				if (response.status === 404) {
					res.status(404).json({
						success: false,
						error: 'Contract not found or not verified',
					})
					return
				}
				throw new Error(`Explorer API error: ${response.statusText}`)
			}

			const data = (await response.json()) as ExplorerContractResponse

			if (!data.abi) {
				res.status(404).json({
					success: false,
					error: 'Contract ABI not available',
				})
				return
			}

			res.status(200).json({
				success: true,
				data: {
					address: data.address?.hash || address,
					name: data.name || 'Unknown Contract',
					abi: data.abi,
					isVerified: data.is_verified || false,
				},
			})
		} catch (error) {
			console.error('Error fetching contract from explorer:', error)
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contract'
			res.status(500).json({
				success: false,
				error: errorMessage,
			})
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
		const errorMessage = error instanceof Error ? error.message : 'Failed to get contract'
		res.status(500).json({
			success: false,
			error: errorMessage,
		})
	}
}

