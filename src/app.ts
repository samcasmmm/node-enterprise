import 'reflect-metadata';
import './core/container/register.js'; // must be imported before any module route file
import express, { type Application, type Request, type Response, type RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.config.js';
import { logger } from './shared/logger/index.js';
import { ResponseBuilderMiddleware } from './core/response/response.middleware.js';
import { notFoundMiddleware, errorHandlerMiddleware } from './core/middlewares/error.middleware.js';
import docsRouter from './docs/docs.routes.js';
import moduleRoutes from './modules/index.js';
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';

class App {
  public readonly instance: Application;
  private isShuttingDown = false;

  constructor() {
    this.instance = express();

    this.initializeSecurity();
    this.initializeParsers();
    this.initializeObservability();
    this.initializeHealthChecks();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeSecurity(): void {
    if (env.NODE_ENV === 'production') {
      this.instance.use(helmet());
    } else {
      this.instance.use(helmet({ contentSecurityPolicy: false }));
    }
    this.instance.use(cors());
    this.instance.use(compression() as unknown as RequestHandler);

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
    });
    this.instance.use('/api', limiter as unknown as RequestHandler);
  }

  private initializeParsers(): void {
    // better-auth needs the raw (unparsed) request for its OAuth/session handlers,
    // so it must be mounted before express.json().
    this.instance.all('/api/auth/*', toNodeHandler(auth) as unknown as RequestHandler);

    this.instance.use(express.json());
    this.instance.use(express.urlencoded({ extended: true }));
    this.instance.use(cookieParser() as unknown as RequestHandler);
  }

  private initializeObservability(): void {
    this.instance.use(
      morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        stream: { write: (msg: string) => logger.info(msg.trim()) },
      }) as RequestHandler
    );
    this.instance.use(ResponseBuilderMiddleware as RequestHandler);
  }

  private initializeHealthChecks(): void {
    this.instance.get('/', (_req: Request, res: Response) => {
      res.json({
        message: 'Antigravity Enterprise API Online',
        status: 'ONLINE',
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    });

    this.instance.get('/healthz', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });

    this.instance.get('/readyz', (_req: Request, res: Response) => {
      if (this.isShuttingDown) return res.status(503).json({ status: 'shutting_down' });
      res.status(200).json({ status: 'ready' });
    });
  }

  private initializeRoutes(): void {
    this.instance.use('/api/docs', docsRouter);
    this.instance.use('/api/v1', moduleRoutes);
  }

  private initializeErrorHandling(): void {
    this.instance.use(notFoundMiddleware);
    this.instance.use(errorHandlerMiddleware);
  }
}

const appClass = new App();
const app = appClass.instance;

export default app;
export { app, App };

