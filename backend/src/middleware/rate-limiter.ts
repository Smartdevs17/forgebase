import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

interface RateLimitStore {
	[key: string]: {
		count: number
		resetTime: number
	}
}

const store: RateLimitStore = {}

const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS, 10)
const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10)

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
	const key = req.ip || 'unknown'
	const now = Date.now()

	Object.keys(store).forEach((k) => {
		if (store[k].resetTime < now) {
			delete store[k]
		}
	})

	let entry = store[key]
	if (!entry || entry.resetTime < now) {
		entry = {
			count: 0,
			resetTime: now + windowMs,
		}
		store[key] = entry
	}

	if (entry.count >= maxRequests) {
		res.status(429).json({
			success: false,
			error: 'Too many requests, please try again later',
		})
		return
	}

	entry.count++

	res.setHeader('X-RateLimit-Limit', maxRequests.toString())
	res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString())
	res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())

	next()
}

