import { Request, Response } from 'express'
import { z } from 'zod'
import { RPCService } from '../services/rpc.service.js'
import { TransactionParserService } from '../services/transaction-parser.service.js'

const rpcService = new RPCService()
const parserService = new TransactionParserService()

const getReceiptSchema = z.object({
	txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'),
	network: z.enum(['mainnet', 'testnet']).optional().default('mainnet'),
})

export const getReceipt = async (req: Request, res: Response): Promise<void> => {
	try {
		const { txHash, network } = getReceiptSchema.parse({
			txHash: req.params.txHash || req.query.txHash,
			network: req.query.network || 'mainnet',
		})

		const receipt = await rpcService.getTransactionReceipt(txHash, network)

		if (!receipt) {
			res.status(404).json({
				success: false,
				error: 'Transaction receipt not found. Transaction may not be fully mined yet.',
			})
			return
		}

		const tx = await rpcService.getTransaction(txHash, network)

		if (!tx) {
			res.status(404).json({
				success: false,
				error: 'Transaction not found',
			})
			return
		}

		const timestamp = await rpcService.getBlockTimestamp(receipt.blockNumber, network)

		// Parse events
		const events = parserService.parseEvents(receipt.logs)

		res.status(200).json({
			success: true,
			data: {
				transactionHash: receipt.transactionHash,
				blockNumber: receipt.blockNumber.toString(),
				blockHash: receipt.blockHash,
				transactionIndex: receipt.transactionIndex,
				from: receipt.from,
				to: receipt.to,
				gasUsed: parserService.formatGasUsed(receipt.gasUsed),
				effectiveGasPrice: parserService.formatGasPrice(receipt.effectiveGasPrice),
				status: receipt.status === 1 ? 'success' : 'failed',
				timestamp: parserService.formatTimestamp(timestamp),
				events,
				logs: receipt.logs,
			},
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

		console.error('Error fetching receipt:', error)
		const errorMessage = error instanceof Error ? error.message : 'Failed to fetch receipt'

		if (
			errorMessage.toLowerCase().includes('not found') ||
			errorMessage.toLowerCase().includes('pending')
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

