import { Request, Response } from 'express'
import { z } from 'zod'
import { SignatureDecoderService } from '../services/signature-decoder.service.js'
import { Event } from '../types/index.js'

const signatureDecoder = new SignatureDecoderService()

const decodeEventsSchema = z.object({
	events: z.array(
		z.object({
			address: z.string(),
			topics: z.array(z.string()),
			data: z.string(),
		})
	),
	abi: z.array(z.any()).optional(),
})

export const decodeEvents = async (req: Request, res: Response): Promise<void> => {
	try {
		const { events, abi } = decodeEventsSchema.parse(req.body)

		// If ABI is provided, add custom event signatures
		if (abi && Array.isArray(abi)) {
			abi.forEach((item) => {
				if (item.type === 'event' && item.name && item.inputs) {
					const params = item.inputs.map((input: any) => input.type).join(',')
					const signature = `${item.name}(${params})`
					try {
						signatureDecoder.addCustomEventSignature(signature)
					} catch (error) {
						console.warn(`Failed to add event signature: ${signature}`, error)
					}
				}
			})
		}

		const decodedEvents: Event[] = events.map((event) => {
			const decoded = signatureDecoder.decodeEvent(event)
			return (
				decoded || {
					name: event.topics[0] || 'Unknown',
					address: event.address,
					topics: event.topics,
					data: event.data,
				}
			)
		})

		res.status(200).json({
			success: true,
			data: decodedEvents,
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

		console.error('Error decoding events:', error)
		const errorMessage = error instanceof Error ? error.message : 'Failed to decode events'
		res.status(500).json({
			success: false,
			error: errorMessage,
		})
	}
}

