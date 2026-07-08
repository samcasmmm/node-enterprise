export class AppError extends Error {
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

export class DomainError extends Error {
  constructor(message: string, public code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
  }
}
