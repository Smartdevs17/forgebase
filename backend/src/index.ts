import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'

const app = createApp()

const startServer = async (): Promise<void> => {
	try {
		await connectDatabase()

		const port = parseInt(env.PORT, 10)
		app.listen(port, () => {
			console.log(`🚀 Server running on port ${port}`)
			console.log(`📡 Environment: ${env.NODE_ENV}`)
			console.log(`🔗 API: http://localhost:${port}${env.API_PREFIX}`)
		})
	} catch (error) {
		console.error('❌ Failed to start server:', error)
		process.exit(1)
	}
}

process.on('SIGTERM', async () => {
	console.log('SIGTERM received, shutting down gracefully...')
	await disconnectDatabase()
	process.exit(0)
})

process.on('SIGINT', async () => {
	console.log('SIGINT received, shutting down gracefully...')
	await disconnectDatabase()
	process.exit(0)
})

startServer()

