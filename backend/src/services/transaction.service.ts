import { RPCService } from './rpc.service.js'
import { TransactionParserService } from './transaction-parser.service.js'
import { TransactionModel } from '../models/Transaction.js'
import { TransactionData } from '../types/index.js'

export class TransactionService {
	private rpcService: RPCService
	private parserService: TransactionParserService

	constructor() {
		this.rpcService = new RPCService()
		this.parserService = new TransactionParserService()
	}

	async decodeTransaction(txHash: string, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<TransactionData> {
		const cacheKey = `${network}:${txHash}`
		const cached = await this.getCachedTransaction(cacheKey)
		if (cached) {
			return cached
		}

		const tx = await this.rpcService.getTransaction(txHash, network)
		
		if (!tx) {
			throw new Error(`Transaction not found on ${network}`)
		}

		const receipt = await this.rpcService.getTransactionReceipt(txHash, network)
		
		if (!receipt) {
			throw new Error('Transaction receipt not found. Transaction may not be fully mined yet.')
		}

		const timestamp = await this.rpcService.getBlockTimestamp(receipt.blockNumber, network)

		let evmTrace = await this.rpcService.traceTransaction(txHash, network)
		
		if (!evmTrace) {
			console.warn('Full transaction tracing not available. Using basic call trace from transaction data.')
			evmTrace = this.rpcService.createBasicCallTrace(tx, receipt)
		}

		const callTrace = this.parserService.parseCallTrace(evmTrace, 0, receipt.status)

		const events = this.parserService.parseEvents(receipt.logs)

		const stateChanges = this.parserService.parseStateChanges(evmTrace, receipt.blockNumber)

		const transactionData: TransactionData = {
			txHash: tx.hash,
			status: receipt.status === 1 ? 'success' : 'failed',
			blockNumber: receipt.blockNumber.toString(),
			timestamp: this.parserService.formatTimestamp(timestamp),
			gasUsed: this.parserService.formatGasUsed(receipt.gasUsed),
			gasPrice: this.parserService.formatGasPrice(receipt.effectiveGasPrice),
			from: tx.from,
			to: tx.to || '',
			value: this.parserService.formatValue(tx.value),
			callTrace,
			events,
			stateChanges,
		}

		await this.cacheTransaction(cacheKey, transactionData)

		return transactionData
	}

	private async getCachedTransaction(cacheKey: string): Promise<TransactionData | null> {
		try {
			const cached = await TransactionModel.findOne({ txHash: cacheKey })
			if (cached) {
				return cached.data as TransactionData
			}
		} catch (error) {
			console.error('Error fetching cached transaction:', error)
		}
		return null
	}

	private async cacheTransaction(cacheKey: string, data: TransactionData): Promise<void> {
		try {
			await TransactionModel.findOneAndUpdate(
				{ txHash: cacheKey },
				{ txHash: cacheKey, data },
				{ upsert: true, new: true }
			)
		} catch (error) {
			console.error('Error caching transaction:', error)
		}
	}
}

