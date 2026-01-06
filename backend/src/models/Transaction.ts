import mongoose, { Schema, Document } from 'mongoose'
import { TransactionData } from '../types/index.js'

export interface TransactionDocument extends Document {
	txHash: string
	data: TransactionData
	createdAt: Date
	updatedAt: Date
}

const CallTraceSchema = new Schema(
	{
		type: {
			type: String,
			enum: ['CALL', 'DELEGATECALL', 'STATICCALL', 'CREATE', 'REVERT'],
			required: true,
		},
		from: { type: String, required: true },
		to: { type: String, required: true },
		value: { type: String, required: true },
		gas: { type: String, required: true },
		gasUsed: { type: String, required: true },
		input: { type: String, required: true },
		output: { type: String, required: true },
		functionName: { type: String },
		success: { type: Boolean, required: true },
		depth: { type: Number, required: true },
		calls: { type: [Schema.Types.Mixed], default: [] },
	},
	{ _id: false }
)

const EventSchema = new Schema(
	{
		name: { type: String, required: true },
		address: { type: String, required: true },
		topics: { type: [String], required: true },
		data: { type: String, required: true },
		decoded: {
			name: { type: String },
			params: [
				{
					name: { type: String },
					type: { type: String },
					value: { type: String },
				},
			],
		},
	},
	{ _id: false }
)

const StateChangeSchema = new Schema(
	{
		address: { type: String, required: true },
		slot: { type: String, required: true },
		before: { type: String, required: true },
		after: { type: String, required: true },
		decoded: {
			variable: { type: String },
			beforeValue: { type: String },
			afterValue: { type: String },
		},
	},
	{ _id: false }
)

const TransactionSchema = new Schema(
	{
		txHash: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		data: {
			txHash: { type: String, required: true },
			status: { type: String, enum: ['success', 'failed'], required: true },
			blockNumber: { type: String, required: true },
			timestamp: { type: String, required: true },
			gasUsed: { type: String, required: true },
			gasPrice: { type: String, required: true },
			from: { type: String, required: true },
			to: { type: String, required: true },
			value: { type: String, required: true },
			callTrace: { type: CallTraceSchema, required: true },
			events: { type: [EventSchema], default: [] },
			stateChanges: { type: [StateChangeSchema], default: [] },
		},
	},
	{
		timestamps: true,
	}
)

TransactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 7 }) // 7 days TTL

export const TransactionModel = mongoose.model<TransactionDocument>(
	'Transaction',
	TransactionSchema
)

