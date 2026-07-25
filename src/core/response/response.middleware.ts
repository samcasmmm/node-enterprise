import { type Request, type Response, type NextFunction } from 'express';
import ResponseBuilder from './response.builder.js';

const ResponseBuilderMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.build = new ResponseBuilder(res);
  next();
};

export { ResponseBuilderMiddleware };
