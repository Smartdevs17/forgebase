import express, { Express } from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import transactionRoutes from './routes/transaction.routes.js'
import contractRoutes from './routes/contract.routes.js'
import eventRoutes from './routes/event.routes.js'
import receiptRoutes from './routes/receipt.routes.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { rateLimiter } from './middleware/rate-limiter.js'

export const createApp = (): Express => {
	const app = express()

	app.use(cors({
		origin: (origin, callback) => {
			const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim())
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true)
			} else {
				callback(new Error('Not allowed by CORS'))
			}
		},
		credentials: true,
	}))
	app.use(express.json())
	app.use(express.urlencoded({ extended: true }))

	app.use(rateLimiter)

	app.get('/health', (_, res) => {
		res.status(200).json({
			success: true,
			message: 'Server is healthy',
			timestamp: new Date().toISOString(),
		})
	})

	app.use(`${env.API_PREFIX}/transactions`, transactionRoutes)
	app.use(`${env.API_PREFIX}/contracts`, contractRoutes)
	app.use(`${env.API_PREFIX}/events`, eventRoutes)
	app.use(`${env.API_PREFIX}/receipts`, receiptRoutes)

	app.use(notFoundHandler)
	app.use(errorHandler)

	return app
}

