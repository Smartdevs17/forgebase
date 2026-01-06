import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
	statusCode?: number
}

export const errorHandler = (
	err: AppError,
	req: Request,
	res: Response,
	_: NextFunction
): void => {
	const statusCode = err.statusCode || 500
	const message = err.message || 'Internal Server Error'

	console.error('Error:', {
		message,
		statusCode,
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
		path: req.path,
		method: req.method,
	})

	res.status(statusCode).json({
		success: false,
		error: message,
		...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
	})
}

export const notFoundHandler = (req: Request, res: Response): void => {
	res.status(404).json({
		success: false,
		error: `Route ${req.method} ${req.path} not found`,
	})
}

