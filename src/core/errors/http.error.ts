import { z } from 'zod';
import { AppError } from './domain.error.js';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'HTTP_ERROR',
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: any[] = [],
  ) {
    super(message, 422, 'VALIDATION_ERROR', true, { errors });
  }

  static fromZod(zodError: z.ZodError): ValidationError {
    const formattedErrors = zodError.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return new ValidationError('Validation failed', formattedErrors);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false);
  }
}

export class ErrorFactory {
  static create(type: string, ...args: any[]): AppError {
    const errorMap: Record<string, any> = {
      validation: ValidationError,
      notFound: NotFoundError,
      unauthorized: UnauthorizedError,
      internal: InternalServerError,
    };

    const ErrorClass = errorMap[type];
    return ErrorClass ? new ErrorClass(...args) : new InternalServerError('Unknown error type');
  }
}
