import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from './errors';
import { logger } from './logger';
import { isProd } from '../config/env';

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)),
  ) as T;
}

export function success<T>(res: Response, data: T, message = 'OK', status = 200) {
  return res.status(status).json(jsonSafe({ success: true, data, message }));
}

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.flatten(),
      },
    });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That file is too large. Photos max 12MB, videos max 40MB.'
        : err.message;
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message },
    });
  }

  if (err instanceof Error && /Only JPG|photos or MP4/i.test(err.message)) {
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: err.message },
    });
  }

  logger.error({ err }, 'Unhandled error');

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'An unexpected error occurred' : String(err),
    },
  });
}
