import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler. Catches all errors thrown in services/controllers
 * and returns a consistent { error: { message, code } } envelope.
 */
export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";

  console.error(`[Error] ${code}: ${err.message}`);

  res.status(statusCode).json({
    error: {
      message: err.message || "Internal server error",
      code,
    },
  });
}

/**
 * Creates a typed error with HTTP status code and error code.
 * Used throughout services to throw domain-specific errors
 * that the error handler converts to API responses.
 */
export function createError(message: string, statusCode: number, code: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
