import { EVMTraceCall, CallTrace, Event, StateChange } from '../types/index.js'
import { SignatureDecoderService } from './signature-decoder.service.js'

export class TransactionParserService {
	private signatureDecoder: SignatureDecoderService

	constructor() {
		this.signatureDecoder = new SignatureDecoderService()
	}

	parseCallTrace(evmTrace: EVMTraceCall, depth: number = 0, receiptStatus?: number): CallTrace {
		const callType = this.mapCallType(evmTrace.type)
		const success = evmTrace.error ? false : (receiptStatus !== undefined ? receiptStatus === 1 : true)

		let functionName: string | undefined
		if (evmTrace.input && evmTrace.input.length >= 10) {
			const decoded = this.signatureDecoder.decodeFunction(evmTrace.input)
			functionName = decoded?.name
		}

		const callTrace: CallTrace = {
			type: callType,
			from: evmTrace.from || '0x',
			to: evmTrace.to || '0x',
			value: this.formatValue(evmTrace.value || '0x0'),
			gas: evmTrace.gas || '0',
			gasUsed: evmTrace.gasUsed || '0',
			input: evmTrace.input || '0x',
			output: evmTrace.output || '0x',
			functionName,
			success,
			depth,
			calls: [],
		}

		if (evmTrace.calls && evmTrace.calls.length > 0) {
			callTrace.calls = evmTrace.calls.map((call) => this.parseCallTrace(call, depth + 1, receiptStatus))
		}

		return callTrace
	}

	parseEvents(logs: Array<{ address: string; topics: string[]; data: string }>): Event[] {
		return logs.map((log) => {
			const decoded = this.signatureDecoder.decodeEvent(log)
			return decoded || {
				name: log.topics[0] || 'Unknown',
				address: log.address,
				topics: log.topics,
				data: log.data,
			}
		})
	}

	parseStateChanges(
		evmTrace: EVMTraceCall,
		blockNumber: number
	): StateChange[] {
		const stateChanges: StateChange[] = []

		this.extractStateChangesRecursive(evmTrace, stateChanges, blockNumber)

		return stateChanges
	}

	private extractStateChangesRecursive(
		evmTrace: EVMTraceCall,
		stateChanges: StateChange[],
		blockNumber: number
	): void {
		if (evmTrace.calls) {
			evmTrace.calls.forEach((call) => {
				this.extractStateChangesRecursive(call, stateChanges, blockNumber)
			})
		}
	}

	private mapCallType(type: string): CallTrace['type'] {
		const upperType = type.toUpperCase()
		if (upperType === 'CALL') return 'CALL'
		if (upperType === 'DELEGATECALL') return 'DELEGATECALL'
		if (upperType === 'STATICCALL') return 'STATICCALL'
		if (upperType === 'CREATE' || upperType === 'CREATE2') return 'CREATE'
		if (upperType === 'REVERT' || upperType === 'SELFDESTRUCT') return 'REVERT'
		return 'CALL'
	}

	formatValue(value: string): string {
		try {
			if (!value || value === '0x' || value === '0x0') {
				return '0'
			}
			const bigIntValue = BigInt(value)
			if (bigIntValue === 0n) {
				return '0'
			}
			const rskValue = Number(bigIntValue) / 1e18
			if (rskValue < 0.000001) {
				return bigIntValue.toString()
			}
			return rskValue.toFixed(6).replace(/\.?0+$/, '')
		} catch (error) {
			return value
		}
	}

	formatGasUsed(gasUsed: string): string {
		try {
			const gas = BigInt(gasUsed)
			return gas.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
		} catch (error) {
			return gasUsed
		}
	}

	formatGasPrice(gasPrice: string): string {
		try {
			const price = BigInt(gasPrice)
			const gwei = Number(price) / 1e9
			return gwei.toFixed(2)
		} catch (error) {
			return gasPrice
		}
	}

	formatTimestamp(date: Date): string {
		return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
	}
}

