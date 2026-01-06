import { Interface, AbiCoder, Result } from 'ethers'
import { Event } from '../types/index.js'

export class SignatureDecoderService {
	private functionSignatures: Map<string, string> = new Map()
	private eventSignatures: Map<string, string> = new Map()
	private abiCoder: AbiCoder

	constructor() {
		this.abiCoder = AbiCoder.defaultAbiCoder()
		this.loadCommonSignatures()
	}

	private loadCommonSignatures(): void {
		this.addFunctionSignature('transfer(address,uint256)', '0xa9059cbb')
		this.addFunctionSignature('approve(address,uint256)', '0x095ea7b3')
		this.addFunctionSignature('transferFrom(address,address,uint256)', '0x23b872dd')
		this.addFunctionSignature('balanceOf(address)', '0x70a08231')
		this.addFunctionSignature('allowance(address,address)', '0xdd62ed3e')
		this.addFunctionSignature('totalSupply()', '0x18160ddd')
		this.addFunctionSignature('name()', '0x06fdde03')
		this.addFunctionSignature('symbol()', '0x95d89b41')
		this.addFunctionSignature('decimals()', '0x313ce567')

		this.addFunctionSignature('safeTransferFrom(address,address,uint256)', '0x42842e0e')
		this.addFunctionSignature('ownerOf(uint256)', '0x6352211e')
		this.addFunctionSignature('tokenURI(uint256)', '0xc87b56dd')

		this.addEventSignature('Transfer(address,address,uint256)', '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
		this.addEventSignature('Approval(address,address,uint256)', '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925')
		this.addEventSignature('ApprovalForAll(address,address,bool)', '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31')
	}

	private addFunctionSignature(signature: string, hash: string): void {
		this.functionSignatures.set(hash.toLowerCase(), signature)
	}

	private addEventSignature(signature: string, hash: string): void {
		this.eventSignatures.set(hash.toLowerCase(), signature)
	}

	decodeFunction(input: string): { name: string; params?: Result } | null {
		if (!input || input === '0x' || input.length < 10) {
			return null
		}

		const functionSelector = input.slice(0, 10).toLowerCase()
		const signature = this.functionSignatures.get(functionSelector)

		if (!signature) {
			return { name: functionSelector }
		}

		const functionName = signature.split('(')[0]

		try {
			const paramTypes = signature
				.split('(')[1]
				.split(')')[0]
				.split(',')
				.filter((type) => type.length > 0)

			if (paramTypes.length > 0 && input.length > 10) {
				const paramData = '0x' + input.slice(10)
				const decoded = this.abiCoder.decode(paramTypes, paramData)
				return { name: functionName, params: decoded }
			}
		} catch (error) {
			console.warn(`Failed to decode function parameters for ${functionName}:`, error)
		}

		return { name: functionName }
	}

	decodeEvent(event: { topics: string[]; data: string }): Event | null {
		if (!event.topics || event.topics.length === 0) {
			return null
		}

		const eventHash = event.topics[0].toLowerCase()
		const signature = this.eventSignatures.get(eventHash)

		if (!signature) {
			return {
				name: eventHash,
				address: '',
				topics: event.topics,
				data: event.data,
			}
		}

		const eventName = signature.split('(')[0]
		const paramTypes = signature
			.split('(')[1]
			.split(')')[0]
			.split(',')
			.filter((type) => type.length > 0)

		const decodedParams: { name: string; type: string; value: string }[] = []

		try {
			let indexedIndex = 1

			for (let i = 1; i < event.topics.length; i++) {
				const topic = event.topics[i]
				if (indexedIndex <= paramTypes.length) {
					const paramType = paramTypes[indexedIndex - 1]
					try {
						const decoded = this.abiCoder.decode([paramType], topic)
						decodedParams.push({
							name: `param${indexedIndex}`,
							type: paramType,
							value: this.formatValue(decoded[0], paramType),
						})
					} catch (error) {
						decodedParams.push({
							name: `param${indexedIndex}`,
							type: paramType,
							value: topic,
						})
					}
					indexedIndex++
				}
			}

			if (event.data && event.data !== '0x' && indexedIndex < paramTypes.length) {
				const remainingTypes = paramTypes.slice(indexedIndex)
				try {
					const decoded = this.abiCoder.decode(remainingTypes, event.data)
					decoded.forEach((value, index) => {
						decodedParams.push({
							name: `param${indexedIndex + index}`,
							type: remainingTypes[index],
							value: this.formatValue(value, remainingTypes[index]),
						})
					})
				} catch (error) {
					console.warn('Failed to decode event data:', error)
				}
			}
		} catch (error) {
			console.warn(`Failed to decode event ${eventName}:`, error)
		}

		return {
			name: eventName,
			address: '',
			topics: event.topics,
			data: event.data,
			decoded: {
				name: eventName,
				params: decodedParams,
			},
		}
	}

	private formatValue(value: unknown, type: string): string {
		if (typeof value === 'bigint') {
			if (type.includes('uint') || type.includes('int')) {
				return value.toString()
			}
			return value.toString()
		}
		if (typeof value === 'string') {
			return value
		}
		if (Array.isArray(value)) {
			return `[${value.map((v) => this.formatValue(v, type)).join(', ')}]`
		}
		return String(value)
	}

	addCustomFunctionSignature(signature: string): void {
		const iface = new Interface([`function ${signature}`])
		const functionName = signature.split('(')[0]
		const func = iface.getFunction(functionName)
		if (func) {
			this.addFunctionSignature(signature, func.selector)
		}
	}

	addCustomEventSignature(signature: string): void {
		const iface = new Interface([`event ${signature}`])
		const eventName = signature.split('(')[0]
		const event = iface.getEvent(eventName)
		if (event) {
			this.addEventSignature(signature, event.topicHash)
		}
	}
}

