import { ethers } from 'ethers'
import { env } from '../config/env.js'
import { Transaction, TransactionReceipt, EVMTraceCall } from '../types/index.js'

export class RPCService {
	private mainnetProvider: ethers.JsonRpcProvider
	private mainnetArchiveProvider: ethers.JsonRpcProvider
	private testnetProvider: ethers.JsonRpcProvider
	private testnetArchiveProvider: ethers.JsonRpcProvider

	constructor() {
		this.mainnetProvider = new ethers.JsonRpcProvider(env.BASE_RPC_URL)
		this.mainnetArchiveProvider = new ethers.JsonRpcProvider(env.BASE_ARCHIVE_NODE_URL)
		
		const testnetRpcUrl = env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
		const testnetArchiveUrl = env.BASE_SEPOLIA_ARCHIVE_NODE_URL || 'https://sepolia.base.org'
		
		this.testnetProvider = new ethers.JsonRpcProvider(testnetRpcUrl)
		this.testnetArchiveProvider = new ethers.JsonRpcProvider(testnetArchiveUrl)
	}

	private getProvider(network: 'mainnet' | 'testnet'): ethers.JsonRpcProvider {
		return network === 'testnet' ? this.testnetProvider : this.mainnetProvider
	}

	private getArchiveProvider(network: 'mainnet' | 'testnet'): ethers.JsonRpcProvider {
		return network === 'testnet' ? this.testnetArchiveProvider : this.mainnetArchiveProvider
	}

	async getTransaction(txHash: string, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<Transaction | null> {
		const provider = this.getProvider(network)
		const archiveProvider = this.getArchiveProvider(network)
		
		try {
			const tx = await provider.getTransaction(txHash)
			if (!tx) {
				try {
					const archiveTx = await archiveProvider.getTransaction(txHash)
					if (!archiveTx) {
						return null
					}
					
					if (archiveTx.blockNumber === null) {
						throw new Error('Transaction is pending and has not been mined yet')
					}

					return {
						hash: archiveTx.hash,
						blockNumber: archiveTx.blockNumber || 0,
						from: archiveTx.from,
						to: archiveTx.to || null,
						value: archiveTx.value.toString(),
						gasPrice: archiveTx.gasPrice?.toString() || '0',
						gasLimit: archiveTx.gasLimit.toString(),
						input: archiveTx.data,
					}
				} catch (archiveError) {
					const archiveErrorMessage = archiveError instanceof Error ? archiveError.message : String(archiveError)
					if (archiveErrorMessage.includes('pending')) {
						throw archiveError
					}
					return null
				}
			}

			if (tx.blockNumber === null) {
				throw new Error('Transaction is pending and has not been mined yet')
			}

			return {
				hash: tx.hash,
				blockNumber: tx.blockNumber || 0,
				from: tx.from,
				to: tx.to || null,
				value: tx.value.toString(),
				gasPrice: tx.gasPrice?.toString() || '0',
				gasLimit: tx.gasLimit.toString(),
				input: tx.data,
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			if (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('unknown transaction')) {
				return null
			}
			
			if (errorMessage.includes('pending')) {
				throw error
			}
			
			console.error('Error fetching transaction:', error)
			throw new Error(`Failed to fetch transaction: ${errorMessage}`)
		}
	}

	async getTransactionReceipt(txHash: string, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<TransactionReceipt | null> {
		const provider = this.getProvider(network)
		const archiveProvider = this.getArchiveProvider(network)
		
		try {
			const receipt = await provider.getTransactionReceipt(txHash)
			if (!receipt) {
				try {
					const archiveReceipt = await archiveProvider.getTransactionReceipt(txHash)
					if (!archiveReceipt) {
						return null
					}

					return {
						transactionHash: archiveReceipt.hash,
						blockNumber: archiveReceipt.blockNumber,
						blockHash: archiveReceipt.blockHash,
						transactionIndex: archiveReceipt.index,
						from: archiveReceipt.from,
						to: archiveReceipt.to,
						gasUsed: archiveReceipt.gasUsed.toString(),
						effectiveGasPrice: archiveReceipt.gasPrice?.toString() || '0',
						status: archiveReceipt.status || 0,
						logs: archiveReceipt.logs.map((log) => ({
							address: log.address,
							topics: [...log.topics],
							data: log.data,
						})),
					}
				} catch (archiveError) {
					return null
				}
			}

			return {
				transactionHash: receipt.hash,
				blockNumber: receipt.blockNumber,
				blockHash: receipt.blockHash,
				transactionIndex: receipt.index,
				from: receipt.from,
				to: receipt.to,
				gasUsed: receipt.gasUsed.toString(),
				effectiveGasPrice: receipt.gasPrice?.toString() || '0',
				status: receipt.status || 0,
				logs: receipt.logs.map((log) => ({
					address: log.address,
					topics: [...log.topics],
					data: log.data,
				})),
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			if (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('unknown transaction')) {
				return null
			}
			
			console.error('Error fetching transaction receipt:', error)
			throw new Error(`Failed to fetch transaction receipt: ${errorMessage}`)
		}
	}

	async getBlockTimestamp(blockNumber: number, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<Date> {
		const provider = this.getProvider(network)
		
		try {
			const block = await provider.getBlock(blockNumber)
			if (!block) {
				throw new Error(`Block ${blockNumber} not found`)
			}
			return new Date(block.timestamp * 1000)
		} catch (error) {
			console.error('Error fetching block timestamp:', error)
			throw new Error(`Failed to fetch block timestamp: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}
	}

	async traceTransaction(txHash: string, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<EVMTraceCall | null> {
		const provider = this.getProvider(network)
		const archiveProvider = this.getArchiveProvider(network)
		
		try {
			const trace = await archiveProvider.send('debug_traceTransaction', [
				txHash,
				{
					tracer: 'callTracer',
					tracerConfig: {
						withLog: true,
						timeout: '60s',
					},
				},
			])

			return trace as EVMTraceCall
		} catch (error) {
			console.warn('Archive node tracing failed, trying regular node...', error)
			
			try {
				const trace = await provider.send('debug_traceTransaction', [
					txHash,
					{
						tracer: 'callTracer',
						tracerConfig: {
							withLog: true,
							timeout: '60s',
						},
					},
				])
				return trace as EVMTraceCall
			} catch (fallbackError) {
				const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
				if (errorMessage.includes('debug_traceTransaction') || errorMessage.includes('does not exist') || errorMessage.includes('not available')) {
					console.warn('debug_traceTransaction not supported by RPC node. Returning null for fallback handling.')
					return null
				}
				
				console.error('Error tracing transaction:', fallbackError)
				throw new Error(`Failed to trace transaction: ${errorMessage}`)
			}
		}
	}

	createBasicCallTrace(tx: Transaction, receipt: TransactionReceipt): EVMTraceCall {
		return {
			type: tx.to ? 'CALL' : 'CREATE',
			from: tx.from,
			to: tx.to || '0x',
			value: tx.value,
			gas: tx.gasLimit,
			gasUsed: receipt.gasUsed,
			input: tx.input,
			output: receipt.status === 1 ? '0x' : '0x',
			calls: [],
		}
	}

	async getStorageAt(address: string, slot: string, blockNumber: number, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<string> {
		const provider = this.getProvider(network)
		
		try {
			const storage = await provider.getStorage(address, slot, blockNumber)
			return storage
		} catch (error) {
			console.error('Error fetching storage:', error)
			throw new Error(`Failed to fetch storage: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}
	}
}

