import { config } from 'dotenv'
import { z } from 'zod'

config()

const envSchema = z.object({
	PORT: z.string().default('3001'),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	BASE_RPC_URL: z.string().url(),
	BASE_ARCHIVE_NODE_URL: z.string().url(),
	BASE_SEPOLIA_RPC_URL: z.string().url().optional(),
	BASE_SEPOLIA_ARCHIVE_NODE_URL: z.string().url().optional(),
	BASESCAN_API_KEY: z.string().optional(),
	MONGODB_URI: z.string(),
	API_PREFIX: z.string().default('/api/v1'),
	CORS_ORIGIN: z.string().optional(),
	CACHE_TTL: z.string().default('3600'),
	RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
	RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
})

export type Env = z.infer<typeof envSchema> & {
	CORS_ORIGIN: string
}

let parsedEnv: z.infer<typeof envSchema>

try {
	parsedEnv = envSchema.parse(process.env)
} catch (error) {
	if (error instanceof z.ZodError) {
		console.error('❌ Invalid environment variables:')
		error.errors.forEach((err) => {
			console.error(`  ${err.path.join('.')}: ${err.message}`)
		})
		process.exit(1)
	}
	throw error
}

const nodeEnv = parsedEnv.NODE_ENV || 'development'

if (nodeEnv === 'production' && !parsedEnv.CORS_ORIGIN) {
	console.error('❌ CORS_ORIGIN is required in production environment')
	process.exit(1)
}

const env: Env = {
	...parsedEnv,
	CORS_ORIGIN: parsedEnv.CORS_ORIGIN || (nodeEnv === 'development' ? 'http://localhost:8080' : ''),
}

export { env }

