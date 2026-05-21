import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode =
    err instanceof AppError
      ? err.statusCode
      : err.message === 'No token provided'
      ? 401
      : err.message === 'Invalid token'
      ? 401
      : err.message === 'Token expired'
      ? 401
      : err.message === 'Unauthorized'
      ? 401
      : err.message === 'Forbidden'
      ? 403
      : err.message.toLowerCase().includes('not found')
      ? 404
      : err.message.toLowerCase().includes('required')
      ? 400
      : err.message.toLowerCase().includes('invalid')
      ? 400
      : 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development'
        ? {
            stack: err.stack,
          }
        : {}),
    },
  });
};

// Made with Bob
