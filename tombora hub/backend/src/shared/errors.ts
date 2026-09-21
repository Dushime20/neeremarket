export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const Errors = {
  unauthorized: (message = 'Authentication required') =>
    new AppError('UNAUTHORIZED', message, 401),
  forbidden: (message = 'You do not have permission to perform this action') =>
    new AppError('FORBIDDEN', message, 403),
  notFound: (resource = 'Resource') =>
    new AppError('NOT_FOUND', `${resource} not found`, 404),
  conflict: (message: string) => new AppError('CONFLICT', message, 409),
  validation: (message: string, details?: unknown) =>
    new AppError('VALIDATION_ERROR', message, 422, details),
  insufficientStock: () =>
    new AppError('INSUFFICIENT_STOCK', 'The requested quantity is not available', 409),
  invalidTransition: (from: string, to: string) =>
    new AppError(
      'INVALID_STATE_TRANSITION',
      `Cannot transition from ${from} to ${to}`,
      409,
    ),
  locked: (message = 'Account temporarily locked') =>
    new AppError('ACCOUNT_LOCKED', message, 423),
  unavailable: (message = 'Service unavailable') =>
    new AppError('UNAVAILABLE', message, 503),
};
