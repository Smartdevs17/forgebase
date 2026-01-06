export interface CallTrace {
	type: 'CALL' | 'DELEGATECALL' | 'STATICCALL' | 'CREATE' | 'REVERT'
	from: string
	to: string
	value: string
	gas: string
	gasUsed: string
	input: string
	output: string
	functionName?: string
	success: boolean
	depth: number
	calls?: CallTrace[]
}

export interface Event {
	name: string
	address: string
	topics: string[]
	data: string
	decoded?: {
		name: string
		params: { name: string; type: string; value: string }[]
	}
}

export interface StateChange {
	address: string
	slot: string
	before: string
	after: string
	decoded?: {
		variable: string
		beforeValue: string
		afterValue: string
	}
}

export interface TransactionData {
	txHash: string
	status: 'success' | 'failed'
	blockNumber: string
	timestamp: string
	gasUsed: string
	gasPrice: string
	from: string
	to: string
	value: string
	callTrace: CallTrace
	events: Event[]
	stateChanges: StateChange[]
}

export interface EVMTraceCall {
	type: string
	from: string
	to: string
	value: string
	gas: string
	gasUsed: string
	input: string
	output: string
	calls?: EVMTraceCall[]
	error?: string
}

export interface TransactionReceipt {
	transactionHash: string
	blockNumber: number
	blockHash: string
	transactionIndex: number
	from: string
	to: string | null
	gasUsed: string
	effectiveGasPrice: string
	status: number
	logs: Array<{
		address: string
		topics: string[]
		data: string
	}>
}

export interface Transaction {
	hash: string
	blockNumber: number
	from: string
	to: string | null
	value: string
	gasPrice: string
	gasLimit: string
	input: string
}

