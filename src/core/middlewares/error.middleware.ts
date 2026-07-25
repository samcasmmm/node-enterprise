import { type Request, type Response, type NextFunction } from 'express';
import { HttpError } from '../errors/http.error.js';
import { DomainError } from '../errors/domain.error.js';

const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PROD';

class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;
  public extra?: any;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational: boolean = true,
    extra?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.extra = extra;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: any[] = [],
  ) {
    super(message, 422, 'VALIDATION_ERROR', true, { errors });
  }
}

class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false);
  }
}

class ErrorFactory {
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

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`${req.originalUrl}`);
  next(error);
};

export const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let extra: any = {};

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    extra = err.extra || {};
  } else if (err instanceof HttpError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  } else if (err instanceof DomainError) {
    statusCode = 400;
    errorCode = err.code;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.build
    .fail()
    .withStatus(statusCode)
    .withMessage(message)
    .withError(errorCode, {
      ...extra,
      ...(isProduction ? {} : { stack: err.stack }),
    })
    .send();
};

export {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  InternalServerError,
  ErrorFactory,
};
