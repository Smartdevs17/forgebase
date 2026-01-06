import { Request, Response } from 'express'
import { TransactionService } from '../services/transaction.service.js'
import { z } from 'zod'

const transactionService = new TransactionService()


const decodeTransactionSchema = z.object({
	txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'),
	network: z.enum(['mainnet', 'testnet']).optional().default('mainnet'),
})

export const decodeTransaction = async (req: Request, res: Response): Promise<void> => {
	try {
		const { txHash, network } = decodeTransactionSchema.parse(req.body)

		const transactionData = await transactionService.decodeTransaction(txHash, network)

		res.status(200).json({
			success: true,
			data: transactionData,
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				success: false,
				error: 'Invalid request',
				details: error.errors,
			})
			return
		}

		console.error('Error decoding transaction:', error)

		const errorMessage = error instanceof Error ? error.message : 'Failed to decode transaction'
		const lowerErrorMessage = errorMessage.toLowerCase()
		
		if (
			lowerErrorMessage.includes('not found') ||
			lowerErrorMessage.includes('transaction not found') ||
			lowerErrorMessage.includes('transaction receipt not found')
		) {
			res.status(404).json({
				success: false,
				error: errorMessage,
			})
			return
		}

		res.status(500).json({
			success: false,
			error: errorMessage,
		})
	}
}

export const getTransaction = async (req: Request, res: Response): Promise<void> => {
	try {
		let { txHash } = req.params
		const network = (req.query.network as 'mainnet' | 'testnet') || 'mainnet'

		if (txHash) {
			txHash = decodeURIComponent(txHash)
		}

		if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
			res.status(400).json({
				success: false,
				error: 'Invalid transaction hash format',
				details: {
					received: txHash,
					expected: '0x followed by 64 hexadecimal characters',
				},
			})
			return
		}

		if (network !== 'mainnet' && network !== 'testnet') {
			res.status(400).json({
				success: false,
				error: 'Invalid network. Must be mainnet or testnet',
			})
			return
		}

		const transactionData = await transactionService.decodeTransaction(txHash, network)

		res.status(200).json({
			success: true,
			data: transactionData,
		})
	} catch (error) {
		console.error('Error fetching transaction:', error)

		const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction'
		const lowerErrorMessage = errorMessage.toLowerCase()
		
		if (
			lowerErrorMessage.includes('not found') ||
			lowerErrorMessage.includes('transaction not found') ||
			lowerErrorMessage.includes('transaction receipt not found')
		) {
			res.status(404).json({
				success: false,
				error: errorMessage,
			})
			return
		}

		res.status(500).json({
			success: false,
			error: errorMessage,
		})
	}
}

